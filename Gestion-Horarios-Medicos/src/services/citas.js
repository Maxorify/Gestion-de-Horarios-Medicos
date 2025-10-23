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
 * Implementación: intenta RPCs comunes; si no existen, devuelve error claro.
 * Ajusta nombres si tu BD los usa distinto.
 */
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
  const args = {
    _paciente_id: paciente_id,
    _doctor_id: doctor_id,
    _disponibilidad_id: disponibilidad_id,
    _inicio: inicioISO,
    _fin: finISO,
    _reprogramar: reprogramarSiExiste,
  };

  // Lista de nombres posibles según cómo la hayas creado en la BD
  const posibles = [
    "reservar_o_cambiar_cita",
    "reservar_o_cambiar",
    "citas_reservar_ocambiar",
  ];

  try {
    const data = await callRpcAny(posibles, args);
    if (!data) {
      return null;
    }
    if (Array.isArray(data)) {
      const first = data[0] ?? null;
      return normalizarCita(first);
    }
    if (data.cita) {
      return normalizarCita(data.cita);
    }
    return normalizarCita(data);
  } catch (error) {
    if (error?.code === "RPC_NOT_FOUND") {
      return upsertCitaLocal({
        paciente_id,
        doctor_id,
        disponibilidad_id,
        inicioISO,
        finISO,
        reprogramarSiExiste,
      });
    }

    handleCitasSupabaseError(error, "No se pudo completar la reserva de la cita.");
    return null;
  }
}
