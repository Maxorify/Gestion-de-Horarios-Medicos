// src/services/citas.js
import { supabase } from "@/services/supabaseClient";

const ESTADOS_CITA_ACTIVAS = ["pendiente", "programada", "confirmada"];

function isRpcNotFoundError(error) {
  if (!error) return false;
  const code = String(error.code ?? error.status ?? "").toUpperCase();
  if (code === "404" || code === "PGRST301" || code === "PGRST404") {
    return true;
  }
  const message = String(error.message ?? "").toLowerCase();
  if (message.includes("could not find") && message.includes("function")) {
    return true;
  }
  if (message.includes("not found") && message.includes("function")) {
    return true;
  }
  return false;
}

function handleCitasSupabaseError(error, fallbackMessage) {
  if (!error) return;
  if (error?.code === "CITA_ACTIVA") {
    throw error;
  }

  const message = String(error.message ?? "");
  const normalized = message.toLowerCase();

  if (normalized.includes("ux_citas_unica_por_paciente_activa")) {
    const friendly = new Error("El paciente ya tiene una cita activa.");
    friendly.code = "CITA_ACTIVA";
    throw friendly;
  }

  if (
    normalized.includes("duplicate key value") &&
    (normalized.includes("citas_disponibilidad") || normalized.includes("disponibilidad"))
  ) {
    const friendly = new Error("Ese horario ya fue reservado por otro paciente.");
    throw friendly;
  }

  if (normalized.includes("foreign key") && normalized.includes("disponibilidad")) {
    const friendly = new Error("La disponibilidad seleccionada ya no existe.");
    throw friendly;
  }

  const fallback = fallbackMessage || message || "Error inesperado de Supabase";
  const wrapped = new Error(fallback);
  wrapped.cause = error;
  throw wrapped;
}

function pickFirst(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (key in obj && obj[key] != null) {
      return obj[key];
    }
  }
  return undefined;
}

function normalizarCita(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const normalized = {
    id: pickFirst(row, ["id", "cita_id"]),
    paciente_id: pickFirst(row, ["paciente_id"]),
    doctor_id: pickFirst(row, ["doctor_id"]),
    disponibilidad_id: pickFirst(row, ["disponibilidad_id"]),
    estado: pickFirst(row, ["estado"]),
    fecha_hora_inicio_agendada: pickFirst(row, [
      "fecha_hora_inicio_agendada",
      "fecha_hora_inicio",
      "inicio",
    ]),
    fecha_hora_fin_agendada: pickFirst(row, [
      "fecha_hora_fin_agendada",
      "fecha_hora_fin",
      "fin",
    ]),
    created_at: pickFirst(row, ["created_at", "creado_en", "fecha_creacion"]),
    updated_at: pickFirst(row, ["updated_at", "actualizado_en"]),
  };

  for (const key of Object.keys(normalized)) {
    if (normalized[key] === undefined) {
      delete normalized[key];
    }
  }

  return normalized;
}

async function upsertCitaLocal({
  paciente_id,
  doctor_id,
  disponibilidad_id,
  inicioISO,
  finISO,
  reprogramarSiExiste,
}) {
  const { data: existingRows, error: lookupError } = await supabase
    .from("citas")
    .select(
      "id, doctor_id, paciente_id, disponibilidad_id, estado, fecha_hora_inicio_agendada, fecha_hora_fin_agendada, created_at, updated_at, deleted_at",
    )
    .eq("paciente_id", paciente_id)
    .in("estado", ESTADOS_CITA_ACTIVAS)
    .is("deleted_at", null)
    .order("fecha_hora_inicio_agendada", { ascending: true })
    .limit(1);

  if (lookupError) {
    handleCitasSupabaseError(lookupError, "No se pudo verificar las citas activas del paciente.");
  }

  const existing = Array.isArray(existingRows) ? existingRows[0] : existingRows;

  if (existing) {
    if (!reprogramarSiExiste) {
      const error = new Error("El paciente ya tiene una cita activa.");
      error.code = "CITA_ACTIVA";
      error.cita = normalizarCita(existing);
      throw error;
    }

    const { data: updated, error: updateError } = await supabase
      .from("citas")
      .update({
        doctor_id,
        disponibilidad_id,
        fecha_hora_inicio_agendada: inicioISO,
        fecha_hora_fin_agendada: finISO,
        estado: "programada",
      })
      .eq("id", existing.id)
      .select(
        "id, doctor_id, paciente_id, disponibilidad_id, estado, fecha_hora_inicio_agendada, fecha_hora_fin_agendada, created_at, updated_at",
      )
      .single();

    if (updateError) {
      handleCitasSupabaseError(updateError, "No se pudo reprogramar la cita.");
    }

    return normalizarCita(updated ?? existing);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("citas")
    .insert({
      paciente_id,
      doctor_id,
      disponibilidad_id,
      fecha_hora_inicio_agendada: inicioISO,
      fecha_hora_fin_agendada: finISO,
      estado: "programada",
    })
    .select(
      "id, doctor_id, paciente_id, disponibilidad_id, estado, fecha_hora_inicio_agendada, fecha_hora_fin_agendada, created_at, updated_at",
    )
    .single();

  if (insertError) {
    handleCitasSupabaseError(insertError, "No se pudo agendar la cita.");
  }

  return normalizarCita(inserted);
}

/**
 * Utilidad: safe RPC con fallback para detectar funciones mal nombradas.
 */
async function callRpcAny(possibleNames, args) {
  let lastErr;
  let rpcNotFoundCount = 0;
  for (const name of possibleNames) {
    try {
      const { data, error } = await supabase.rpc(name, args);
      if (error) throw error;
      return data;
    } catch (e) {
      if (isRpcNotFoundError(e)) {
        rpcNotFoundCount += 1;
        lastErr = e;
        continue;
      }
      lastErr = e;
      break;
    }
  }
  if (rpcNotFoundCount === possibleNames.length) {
    const error = new Error(`Ninguna RPC válida encontrada: ${possibleNames.join(", ")}`);
    error.code = "RPC_NOT_FOUND";
    error.cause = lastErr;
    throw error;
  }
  throw lastErr ?? new Error(`Ninguna RPC válida encontrada: ${possibleNames.join(", ")}`);
}

/**
 * Lista citas programadas o pendientes para check-in (secretaría).
 * RPC: listar_citas_para_checkin(_desde,_hasta,_doctor_id,_estado,_search)
 */
export async function listarCitasParaCheckin({
  desdeISO,
  hastaISO,
  doctorId = null,
  estados = ["programada", "pendiente"],
  search = null,
}) {
  const args = {
    _desde: desdeISO,
    _hasta: hastaISO,
    _doctor_id: doctorId,
    _estado: estados,
    _search: search,
  };
  const data = await callRpcAny(["listar_citas_para_checkin"], args);
  return Array.isArray(data) ? data : [];
}

/**
 * Marca llegada (check-in).
 * RPC: checkin_paciente(_cita_id)
 */
export async function checkinPaciente({ citaId }) {
  if (!citaId) throw new Error("citaId es obligatorio");
  const { data, error } = await supabase.rpc("checkin_paciente", { _cita_id: citaId });
  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * Anula cita programada/pendiente.
 * RPC: anular_cita(_cita_id,_motivo)
 */
export async function anularCita({ citaId, motivo = null }) {
  if (!citaId) throw new Error("citaId es obligatorio");
  const { data, error } = await supabase.rpc("anular_cita", {
    _cita_id: citaId,
    _motivo: motivo,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * Confirma pago (demo) y pasa a "confirmada".
 * RPC: confirmar_cita_simple(_cita_id,_usuario_id_legacy,_monto,_metodo,_obs)
 */
export async function confirmarCitaSimple({
  citaId,
  usuarioIdLegacy,
  monto = 0,
  metodo = null,
  obs = null,
}) {
  if (!citaId) throw new Error("citaId es obligatorio");
  if (!usuarioIdLegacy) throw new Error("usuarioIdLegacy requerido");
  const { data, error } = await supabase.rpc("confirmar_cita_simple", {
    _cita_id: citaId,
    _usuario_id_legacy: usuarioIdLegacy,
    _monto: monto,
    _metodo: metodo,
    _obs: obs,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * Lista citas confirmadas del doctor.
 * RPC: listar_citas_doctor_confirmadas(_doctor_id,_desde,_hasta)
 */
export async function listarCitasDoctorConfirmadas({
  doctorId,
  desdeISO = null,
  hastaISO = null,
}) {
  if (!doctorId) throw new Error("doctorId es obligatorio");
  const args = { _doctor_id: doctorId };
  if (desdeISO) args._desde = desdeISO;
  if (hastaISO) args._hasta = hastaISO;
  const data = await callRpcAny(["listar_citas_doctor_confirmadas"], args);
  return Array.isArray(data) ? data : [];
}

/**
 * (LEGACY) Lista citas por doctor con filtro opcional de rango.
 * Firma usada hoy por SeleccionarHorarioDoctor:
 *   listarCitasPorDoctor(doctorId, { startUtcISO, endUtcISO })
 *
 * Implementación: query directa a la tabla 'citas' por compatibilidad.
 */
export async function listarCitasPorDoctor(
  doctorId,
  { startUtcISO = null, endUtcISO = null } = {}
) {
  if (!doctorId) throw new Error("doctorId es obligatorio");
  let q = supabase
    .from("citas")
    .select(
      "id, doctor_id, paciente_id, disponibilidad_id, estado, fecha_hora_inicio_agendada, fecha_hora_fin_agendada, created_at, updated_at"
    )
    .eq("doctor_id", doctorId)
    .is("deleted_at", null);

  if (startUtcISO) {
    q = q.gte("fecha_hora_inicio_agendada", startUtcISO);
  }
  if (endUtcISO) {
    q = q.lt("fecha_hora_inicio_agendada", endUtcISO);
  }

  const { data, error } = await q;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Reservar o reprogramar una cita.
 * Firmas esperadas por SeleccionarHorarioDoctor:
 *   reservarOCambiar({
 *     paciente_id, doctor_id, disponibilidad_id, inicioISO, finISO, reprogramarSiExiste
 *   })
 *
 * Primero intenta las RPC tradicionales; si no existen, aplica el fallback local.
 */
// --------------------------
// NUEVO: helper para RPC segura
// --------------------------
async function safeRpc(fnName, args) {
  const { data, error } = await supabase.rpc(fnName, args);
  if (!error) return { data };
  if (isRpcMissingError(error)) return { data: null, missing: true };
  // Error real de RPC: propagar
  throw error;
}

function isRpcMissingError(error) {
  const msg = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();
  return (
    msg.includes("not found") ||
    (msg.includes("function") && msg.includes("does not exist")) ||
    code === "PGRST301" ||
    code === "404"
  );
}

// --------------------------
// NUEVO: validadores y utils fallback
// --------------------------
async function validateAvailabilityOwnership(disponibilidad_id, doctor_id) {
  const { data, error } = await supabase
    .from("disponibilidad")
    .select("id, doctor_id, fecha_hora_inicio, fecha_hora_fin, deleted_at")
    .eq("id", disponibilidad_id)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.deleted_at) {
    throw new Error("La disponibilidad no existe o fue eliminada");
  }
  if (Number(data.doctor_id) !== Number(doctor_id)) {
    throw new Error("La disponibilidad no corresponde a ese doctor");
  }
  return data; // incluye fechas de la disponibilidad
}

function validateFitsRange(inicioISO, finISO, disp) {
  if (!inicioISO || !finISO) throw new Error("Rango de horario inválido");
  const inicio = new Date(inicioISO).toISOString();
  const fin = new Date(finISO).toISOString();
  const dIni = new Date(disp.fecha_hora_inicio).toISOString();
  const dFin = new Date(disp.fecha_hora_fin).toISOString();

  if (inicio >= fin) throw new Error("El bloque horario es inválido");
  if (inicio < dIni || fin > dFin) {
    throw new Error("El horario no cabe dentro de la disponibilidad");
  }
}

async function checkOverlaps({ doctor_id, paciente_id, inicioISO, finISO, excludeCitaId = null }) {
  const estadosActivos = ["programada", "pendiente", "confirmada"];

  // Solape doctor
  {
    let q = supabase
      .from("citas")
      .select("id, fecha_hora_inicio_agendada, fecha_hora_fin_agendada, estado, deleted_at")
      .eq("doctor_id", doctor_id)
      .in("estado", estadosActivos)
      .is("deleted_at", null)
      .lt("fecha_hora_inicio_agendada", finISO)
      .gt("fecha_hora_fin_agendada", inicioISO);

    if (excludeCitaId) q = q.neq("id", excludeCitaId);

    const { data, error } = await q;
    if (error) throw error;
    if (Array.isArray(data) && data.length > 0) {
      throw new Error("El bloque ya está ocupado para el doctor");
    }
  }

  // Solape paciente
  {
    let q = supabase
      .from("citas")
      .select("id, fecha_hora_inicio_agendada, fecha_hora_fin_agendada, estado, deleted_at")
      .eq("paciente_id", paciente_id)
      .in("estado", estadosActivos)
      .is("deleted_at", null)
      .lt("fecha_hora_inicio_agendada", finISO)
      .gt("fecha_hora_fin_agendada", inicioISO);

    if (excludeCitaId) q = q.neq("id", excludeCitaId);

    const { data, error } = await q;
    if (error) throw error;
    if (Array.isArray(data) && data.length > 0) {
      throw new Error("El paciente ya tiene otra cita que se solapa");
    }
  }
}

async function findActiveAppointmentForPatient(paciente_id) {
  const nowISO = new Date().toISOString();
  const estadosActivos = ["programada", "pendiente", "confirmada"];
  const { data, error } = await supabase
    .from("citas")
    .select(
      "id, paciente_id, doctor_id, disponibilidad_id, estado, fecha_hora_inicio_agendada, fecha_hora_fin_agendada, created_at, updated_at"
    )
    .eq("paciente_id", paciente_id)
    .in("estado", estadosActivos)
    .is("deleted_at", null)
    .gte("fecha_hora_inicio_agendada", nowISO)
    .order("fecha_hora_inicio_agendada", { ascending: true })
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

function normalizeCita(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id,
    paciente_id: row.paciente_id,
    doctor_id: row.doctor_id,
    disponibilidad_id: row.disponibilidad_id,
    estado: row.estado,
    fecha_hora_inicio_agendada: row.fecha_hora_inicio_agendada,
    fecha_hora_fin_agendada: row.fecha_hora_fin_agendada,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// -----------------------------------------------------------
// REEMPLAZAR POR COMPLETO la implementación de reservarOCambiar
// -----------------------------------------------------------
export async function reservarOCambiar({
  paciente_id,
  doctor_id,
  disponibilidad_id,
  inicioISO,
  finISO,
  reprogramarSiExiste = false,
}) {
  if (!paciente_id || !doctor_id || !disponibilidad_id || !inicioISO || !finISO) {
    throw new Error("Faltan parámetros para reservarOCambiar");
  }

  // 1) Intento RPC (si existen)
  const rpcArgs = {
    _paciente_id: paciente_id,
    _doctor_id: doctor_id,
    _disponibilidad_id: disponibilidad_id,
    _inicio: inicioISO,
    _fin: finISO,
    _reprogramar: reprogramarSiExiste,
  };

  const rpcNames = ["reservar_o_cambiar_cita", "reservar_o_cambiar", "citas_reservar_ocambiar"];
  for (const name of rpcNames) {
    try {
      const { data, missing } = await safeRpc(name, rpcArgs);
      if (!missing && data) {
        // RPC existente y exitosa
        return data;
      }
      // missing => probar siguiente
    } catch (e) {
      // Error real de RPC => propagar
      throw e;
    }
  }

  // 2) Fallback local: validaciones + insert/update directo en public.citas

  // 2.1 validar disponibilidad del doctor
  const disp = await validateAvailabilityOwnership(disponibilidad_id, doctor_id);

  // 2.2 validar que el rango cabe en la disponibilidad
  validateFitsRange(inicioISO, finISO, disp);

  // 2.3 detectar cita activa del paciente
  const activa = await findActiveAppointmentForPatient(paciente_id);

  if (activa && !reprogramarSiExiste) {
    const err = new Error("El paciente ya tiene una cita activa");
    err.code = "CITA_ACTIVA";
    err.cita = normalizeCita(activa);
    throw err;
  }

  if (activa && reprogramarSiExiste) {
    // 2.4 solapes al reprogramar (excluir la misma cita)
    await checkOverlaps({
      doctor_id,
      paciente_id,
      inicioISO,
      finISO,
      excludeCitaId: activa.id,
    });

    const { data, error } = await supabase
      .from("citas")
      .update({
        doctor_id,
        disponibilidad_id,
        fecha_hora_inicio_agendada: inicioISO,
        fecha_hora_fin_agendada: finISO,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activa.id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("No se pudo reprogramar la cita");
    return normalizeCita(data);
  }

  // 2.5 solapes al crear
  await checkOverlaps({ doctor_id, paciente_id, inicioISO, finISO });

  // 2.6 crear nueva
  const { data, error } = await supabase
    .from("citas")
    .insert([
      {
        paciente_id,
        doctor_id,
        disponibilidad_id,
        estado: "programada",
        fecha_hora_inicio_agendada: inicioISO,
        fecha_hora_fin_agendada: finISO,
      },
    ])
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("No se pudo crear la cita");

  return normalizeCita(data);
}
