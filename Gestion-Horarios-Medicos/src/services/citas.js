// src/services/citas.js
import { supabase } from "@/services/supabaseClient";

/**
 * Utilidad: safe RPC con fallback para detectar funciones mal nombradas.
 */
async function callRpcAny(possibleNames, args) {
  let lastErr;
  for (const name of possibleNames) {
    try {
      const { data, error } = await supabase.rpc(name, args);
      if (error) throw error;
      return data;
    } catch (e) {
      lastErr = e;
    }
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

  const data = await callRpcAny(posibles, args);
  // Si tu RPC devuelve { ok, cita } u otro formato, adapta aquí:
  return data;
}
