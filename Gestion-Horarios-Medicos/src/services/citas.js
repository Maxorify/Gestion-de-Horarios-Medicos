// src/services/citas.js
import { supabase } from "@/services/supabaseClient";

const ESTADOS_CITA_ACTIVAS = ["pendiente", "programada", "confirmada"];

const RPC_AVAILABILITY_CACHE = new Map();
const RPC_AVAILABILITY_STORAGE_PREFIX = "citas.rpc.";

/* ----------------------------- localStorage cache ----------------------------- */
function getRpcAvailabilityFromStorage(key) {
  if (typeof window === "undefined" || !window?.localStorage) return undefined;
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}
function setRpcAvailabilityInStorage(key, value) {
  if (typeof window === "undefined" || !window?.localStorage) return;
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {}
}
function getRpcAvailability(cacheKey) {
  if (!cacheKey) return undefined;
  if (RPC_AVAILABILITY_CACHE.has(cacheKey)) {
    return RPC_AVAILABILITY_CACHE.get(cacheKey);
  }
  const stored = getRpcAvailabilityFromStorage(cacheKey);
  if (stored === undefined) return undefined;
  const normalized = stored === "1";
  RPC_AVAILABILITY_CACHE.set(cacheKey, normalized);
  return normalized;
}
function setRpcAvailability(cacheKey, value) {
  if (!cacheKey) return;
  RPC_AVAILABILITY_CACHE.set(cacheKey, Boolean(value));
  setRpcAvailabilityInStorage(cacheKey, Boolean(value));
}

/* ---------------------------------- helpers ---------------------------------- */
function isRpcNotFoundError(error) {
  if (!error) return false;
  const code = String(error.code ?? error.status ?? "").toUpperCase();
  if (code === "404" || code === "PGRST301" || code === "PGRST404") return true;
  const message = String(error.message ?? "").toLowerCase();
  return (
    (message.includes("could not find") && message.includes("function")) ||
    (message.includes("not found") && message.includes("function"))
  );
}

function handleCitasSupabaseError(error, fallbackMessage) {
  if (!error) return;
  if (error?.code === "CITA_ACTIVA") throw error;

  const message = String(error.message ?? "");
  const normalized = message.toLowerCase();

  // Un paciente ya tiene una activa (si tu unique se llama así)
  if (normalized.includes("ux_citas_unica_por_paciente_activa")) {
    const friendly = new Error("El paciente ya tiene una cita activa.");
    friendly.code = "CITA_ACTIVA";
    throw friendly;
  }

  // Choque típico de reserva/solape
  if (
    normalized.includes("duplicate key value") &&
    (normalized.includes("citas_disponibilidad") || normalized.includes("disponibilidad"))
  ) {
    throw new Error("Ese horario ya fue reservado por otro paciente.");
  }

  if (normalized.includes("foreign key") && normalized.includes("disponibilidad")) {
    throw new Error("La disponibilidad seleccionada ya no existe.");
  }

  const fallback = fallbackMessage || message || "Error inesperado de Supabase";
  const wrapped = new Error(fallback);
  wrapped.cause = error;
  throw wrapped;
}

function pickFirst(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (key in obj && obj[key] != null) return obj[key];
  }
  return undefined;
}

function normalizarCita(row) {
  if (!row || typeof row !== "object") return null;
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
    if (normalized[key] === undefined) delete normalized[key];
  }
  return normalized;
}

/* ---------------------------- callRpc con fallback ---------------------------- */
async function callRpcAny(possibleNames, args, { availabilityCacheKey } = {}) {
  const cacheKey = availabilityCacheKey
    ? `${RPC_AVAILABILITY_STORAGE_PREFIX}${availabilityCacheKey}`
    : null;

  if (cacheKey && getRpcAvailability(cacheKey) === false) {
    const cachedError = new Error(`Ninguna RPC válida encontrada: ${possibleNames.join(", ")}`);
    cachedError.code = "RPC_NOT_FOUND";
    throw cachedError;
  }

  let lastErr;
  let rpcNotFoundCount = 0;
  for (const name of possibleNames) {
    try {
      const { data, error } = await supabase.rpc(name, args);
      if (error) throw error;
      if (cacheKey) setRpcAvailability(cacheKey, true);
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
    if (cacheKey) setRpcAvailability(cacheKey, false);
    const error = new Error(`Ninguna RPC válida encontrada: ${possibleNames.join(", ")}`);
    error.code = "RPC_NOT_FOUND";
    error.cause = lastErr;
    throw error;
  }
  throw lastErr ?? new Error(`Ninguna RPC válida encontrada: ${possibleNames.join(", ")}`);
}

/* --------------------------------- servicios --------------------------------- */
/** Check-in list (secretaría) */
export async function listarCitasParaCheckin({
  desdeISO,
  hastaISO,
  doctorId = null,
  estados = ["programada", "pendiente"],
  search = null,
}) {
  const args = { _desde: desdeISO, _hasta: hastaISO, _doctor_id: doctorId, _estado: estados, _search: search };
  const data = await callRpcAny(["listar_citas_para_checkin"], args);
  return Array.isArray(data) ? data : [];
}

/** Check-in */
export async function checkinPaciente({ citaId }) {
  if (!citaId) throw new Error("citaId es obligatorio");
  const { data, error } = await supabase.rpc("checkin_paciente", { _cita_id: citaId });
  if (error) throw error;
  return data?.[0] ?? null;
}

/** Anular cita */
export async function anularCita({ citaId, motivo = null }) {
  if (!citaId) throw new Error("citaId es obligatorio");
  const { data, error } = await supabase.rpc("anular_cita", { _cita_id: citaId, _motivo: motivo });
  if (error) throw error;
  return data?.[0] ?? null;
}

/** Confirmar (pago demo) → confirmada */
export async function confirmarCitaSimple({ citaId, usuarioIdLegacy, monto = 0, metodo = null, obs = null }) {
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

/** Listar confirmadas del doctor */
export async function listarCitasDoctorConfirmadas({ doctorId, desdeISO = null, hastaISO = null }) {
  if (!doctorId) throw new Error("doctorId es obligatorio");
  const args = { _doctor_id: doctorId };
  if (desdeISO) args._desde = desdeISO;
  if (hastaISO) args._hasta = hastaISO;
  const data = await callRpcAny(["listar_citas_doctor_confirmadas"], args);
  return Array.isArray(data) ? data : [];
}

/** (LEGACY) Citas por doctor con rango */
export async function listarCitasPorDoctor(doctorId, { startUtcISO = null, endUtcISO = null } = {}) {
  if (!doctorId) throw new Error("doctorId es obligatorio");
  let q = supabase
    .from("citas")
    .select(
      "id, doctor_id, paciente_id, disponibilidad_id, estado, fecha_hora_inicio_agendada, fecha_hora_fin_agendada, created_at, updated_at"
    )
    .eq("doctor_id", doctorId)
    .is("deleted_at", null);

  if (startUtcISO) q = q.gte("fecha_hora_inicio_agendada", startUtcISO);
  if (endUtcISO) q = q.lt("fecha_hora_inicio_agendada", endUtcISO);

  const { data, error } = await q;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/* ----------------------- reservar o reprogramar (final) ---------------------- */
const reservarRpcNames = ["reservar_o_cambiar_cita", "reservar_o_cambiar", "citas_reservar_ocambiar"];
let reservarRpcMode = "unknown"; // "rpc" | "local" | "unknown"
let reservarRpcPreferred = null;

async function safeRpc(fnName, args) {
  const { data, error } = await supabase.rpc(fnName, args);
  if (!error) return { data };
  if (isRpcMissingError(error)) return { data: null, missing: true };
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

/* ------ validaciones para fallback local ------ */
async function validateAvailabilityOwnership(disponibilidad_id, doctor_id) {
  const { data, error } = await supabase
    .from("disponibilidad")
    .select("id, doctor_id, fecha_hora_inicio, fecha_hora_fin, deleted_at")
    .eq("id", disponibilidad_id)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.deleted_at) throw new Error("La disponibilidad no existe o fue eliminada");
  if (Number(data.doctor_id) !== Number(doctor_id)) throw new Error("La disponibilidad no corresponde a ese doctor");
  return data;
}
function validateFitsRange(inicioISO, finISO, disp) {
  if (!inicioISO || !finISO) throw new Error("Rango de horario inválido");
  const inicio = new Date(inicioISO).toISOString();
  const fin = new Date(finISO).toISOString();
  const dIni = new Date(disp.fecha_hora_inicio).toISOString();
  const dFin = new Date(disp.fecha_hora_fin).toISOString();
  if (inicio >= fin) throw new Error("El bloque horario es inválido");
  if (inicio < dIni || fin > dFin) throw new Error("El horario no cabe dentro de la disponibilidad");
}
async function checkOverlaps({ doctor_id, paciente_id, inicioISO, finISO, excludeCitaId = null }) {
  const estadosActivos = ["programada", "pendiente", "confirmada"];

  // doctor
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
    if (Array.isArray(data) && data.length > 0) throw new Error("El bloque ya está ocupado para el doctor");
  }

  // paciente
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
    if (Array.isArray(data) && data.length > 0) throw new Error("El paciente ya tiene otra cita que se solapa");
  }
}
async function findActiveAppointmentForPatient(paciente_id) {
  const nowISO = new Date().toISOString();
  const { data, error } = await supabase
    .from("citas")
    .select(
      "id, paciente_id, doctor_id, disponibilidad_id, estado, fecha_hora_inicio_agendada, fecha_hora_fin_agendada, created_at, updated_at"
    )
    .eq("paciente_id", paciente_id)
    .in("estado", ESTADOS_CITA_ACTIVAS)
    .is("deleted_at", null)
    .gte("fecha_hora_inicio_agendada", nowISO)
    .order("fecha_hora_inicio_agendada", { ascending: true })
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

/* --------------------------- reservar / reprogramar -------------------------- */
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

  // 1) RPC (si existen)
  if (reservarRpcMode !== "local") {
    const rpcArgs = {
      _paciente_id: paciente_id,
      _doctor_id: doctor_id,
      _disponibilidad_id: disponibilidad_id,
      _inicio: inicioISO,
      _fin: finISO,
      _reprogramar: reprogramarSiExiste,
    };

    const candidates = reservarRpcMode === "rpc" && reservarRpcPreferred ? [reservarRpcPreferred] : reservarRpcNames;
    for (const name of candidates) {
      try {
        const { data, missing } = await safeRpc(name, rpcArgs);
        if (missing) continue;
        if (data) {
          reservarRpcMode = "rpc";
          reservarRpcPreferred = name;
          // Normalizar respuesta de RPC (sea array u objeto)
          const payload = Array.isArray(data) ? data[0] ?? null : data?.cita ?? data;
          return normalizarCita(payload);
        }
      } catch (e) {
        // Error real de RPC → parar aquí y propagar
        throw e;
      }
    }
    // Si ninguna está, marcamos local
    reservarRpcMode = "local";
    reservarRpcPreferred = null;
  }

  // 2) Fallback local
  const disp = await validateAvailabilityOwnership(disponibilidad_id, doctor_id);
  validateFitsRange(inicioISO, finISO, disp);

  const activa = await findActiveAppointmentForPatient(paciente_id);

  if (activa && !reprogramarSiExiste) {
    const err = new Error("El paciente ya tiene una cita activa");
    err.code = "CITA_ACTIVA";
    err.cita = normalizarCita(activa);
    throw err;
  }

  // Reprogramación
  if (activa && reprogramarSiExiste) {
    await checkOverlaps({ doctor_id, paciente_id, inicioISO, finISO, excludeCitaId: activa.id });

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

    if (error) handleCitasSupabaseError(error, "No se pudo reprogramar la cita.");
    if (!data) throw new Error("No se pudo reprogramar la cita");
    return normalizarCita(data);
  }

  // Nueva reserva
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

  if (error) handleCitasSupabaseError(error, "No se pudo agendar la cita.");
  if (!data) throw new Error("No se pudo crear la cita");

  return normalizarCita(data);
}
