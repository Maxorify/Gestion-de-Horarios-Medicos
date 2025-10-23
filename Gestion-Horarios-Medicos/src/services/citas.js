// src/services/citas.js
import { supabase } from "@/services/supabaseClient";

/**
 * Lista citas programadas o pendientes para check-in.
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
  const { data, error } = await supabase.rpc("listar_citas_para_checkin", args);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Marca la llegada (check-in) de un paciente.
 */
export async function checkinPaciente({ citaId }) {
  if (!citaId) throw new Error("citaId es obligatorio");
  const { data, error } = await supabase.rpc("checkin_paciente", { _cita_id: citaId });
  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * Anula una cita programada o pendiente.
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
 * Confirma pago y cambia el estado a "confirmada".
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
 * Lista las citas confirmadas para un doctor.
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
  const { data, error } = await supabase.rpc("listar_citas_doctor_confirmadas", args);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * (Legacy) Lista todas las citas por doctor.
 * Mantiene compatibilidad con SeleccionarHorarioDoctor.jsx.
 */
export async function listarCitasPorDoctor(doctorId) {
  if (!doctorId) throw new Error("doctorId es obligatorio");
  const { data, error } = await supabase
    .from("citas")
    .select("*")
    .eq("doctor_id", doctorId)
    .is("deleted_at", null);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
