// src/services/citas.js
import { supabase } from "@/services/supabaseClient";

const RPC_AVAILABILITY_CACHE = new Map();
const RPC_AVAILABILITY_STORAGE_PREFIX = "citas.rpc.";

function getRpcAvailabilityFromStorage(key) {
  if (typeof window === "undefined" || !window?.localStorage) {
    return undefined;
  }
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch (error) {
    console.warn("No se pudo leer disponibilidad de RPC desde localStorage", error);
    return undefined;
  }
}

function setRpcAvailabilityInStorage(key, value) {
  if (typeof window === "undefined" || !window?.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch (error) {
    console.warn("No se pudo guardar disponibilidad de RPC en localStorage", error);
  }
}

function getRpcAvailability(cacheKey) {
  if (!cacheKey) return undefined;
  if (RPC_AVAILABILITY_CACHE.has(cacheKey)) {
    return RPC_AVAILABILITY_CACHE.get(cacheKey);
  }
  const stored = getRpcAvailabilityFromStorage(cacheKey);
  if (stored === undefined) {
    return undefined;
  }
  const normalized = stored === "1";
  RPC_AVAILABILITY_CACHE.set(cacheKey, normalized);
  return normalized;
}

function setRpcAvailability(cacheKey, value) {
  if (!cacheKey) return;
  RPC_AVAILABILITY_CACHE.set(cacheKey, Boolean(value));
  setRpcAvailabilityInStorage(cacheKey, Boolean(value));
}

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

/**
 * Utilidad: safe RPC con fallback para detectar funciones mal nombradas.
 */
async function callRpcAny(possibleNames, args, { availabilityCacheKey } = {}) {
  const cacheKey = availabilityCacheKey
    ? `${RPC_AVAILABILITY_STORAGE_PREFIX}${availabilityCacheKey}`
    : null;

  if (cacheKey && getRpcAvailability(cacheKey) === false) {
    const cachedError = new Error(
      `Ninguna RPC válida encontrada: ${possibleNames.join(", ")}`,
    );
    cachedError.code = "RPC_NOT_FOUND";
    throw cachedError;
  }

  let lastErr;
  let rpcNotFoundCount = 0;
  for (const name of possibleNames) {
    try {
      const { data, error } = await supabase.rpc(name, args);
      if (error) throw error;
      if (cacheKey) {
        setRpcAvailability(cacheKey, true);
      }
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
    if (cacheKey) {
      setRpcAvailability(cacheKey, false);
    }
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
 * Implementación actual: validaciones locales y operaciones directas sobre public.citas.
 */
// --------------------------
// Validadores y utilidades para reservarOCambiar
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
// Nueva implementación local de reservarOCambiar
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

  // Validar disponibilidad y rango
  const disp = await validateAvailabilityOwnership(disponibilidad_id, doctor_id);
  validateFitsRange(inicioISO, finISO, disp);

  // ¿Paciente ya tiene cita activa?
  const activa = await findActiveAppointmentForPatient(paciente_id);

  if (activa && !reprogramarSiExiste) {
    const err = new Error("El paciente ya tiene una cita activa");
    err.code = "CITA_ACTIVA";
    err.cita = normalizeCita(activa);
    throw err;
  }

  if (activa && reprogramarSiExiste) {
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

  // Nueva cita
  await checkOverlaps({ doctor_id, paciente_id, inicioISO, finISO });

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
