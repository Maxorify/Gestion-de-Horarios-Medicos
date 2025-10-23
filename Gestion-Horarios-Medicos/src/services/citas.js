// src/services/citas.js
import { supabase } from "@/services/supabaseClient";

/**
 * Lista citas para el panel de secretaría (check-in/anular/confirmar).
 * Usa la RPC listar_citas_para_checkin en BD.
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
 * Marca llegada (check-in) de una cita.
 */
export async function checkinPaciente({ citaId }) {
  if (!citaId) throw new Error("citaId es obligatorio");
  const { data, error } = await supabase.rpc("checkin_paciente", { _cita_id: citaId });
  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * Anula una cita desde programada/pendiente.
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
 * Confirma pago (demo) y pasa la cita a confirmada.
 * Requiere BIGINT usuarioIdLegacy en sesión.
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
