import { supabase } from "@/services/supabaseClient";

function handleSupabaseError(error, fallbackMessage) {
  if (!error) {
    return;
  }
  const message = error.message || fallbackMessage || "Error inesperado de Supabase";
  const wrapped = new Error(message);
  wrapped.cause = error;
  throw wrapped;
}

function obtenerMarcaTemporalActual() {
  const ahora = new Date();
  const iso = ahora.toISOString();
  return {
    fecha: iso.slice(0, 10),
    hora: iso.slice(11, 19),
  };
}

/**
 * Registra la asistencia de un doctor utilizando la fecha y hora actual.
 *
 * @param {number|string} doctorId
 * @returns {Promise<Record<string, any>>}
 */
export async function marcarAsistencia(doctorId) {
  if (!doctorId) {
    throw new Error("El identificador del doctor es requerido para marcar asistencia.");
  }

  const { fecha, hora } = obtenerMarcaTemporalActual();

  const { data, error } = await supabase
    .from("asistencias")
    .insert({
      doctor_id: doctorId,
      fecha_asistencia: fecha,
      hora_llegada: hora,
    })
    .select()
    .single();

  handleSupabaseError(error, "No se pudo registrar la asistencia del doctor.");
  return data;
}

/**
 * Verifica si un doctor registró asistencia en una fecha específica.
 *
 * @param {number|string} doctorId
 * @param {string} fecha
 * @returns {Promise<boolean>}
 */
export async function verificarAsistencia(doctorId, fecha) {
  if (!doctorId) {
    throw new Error("El identificador del doctor es requerido para verificar la asistencia.");
  }
  if (!fecha) {
    throw new Error("La fecha es requerida para verificar la asistencia.");
  }

  const { data, error } = await supabase
    .from("asistencias")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("fecha_asistencia", fecha)
    .maybeSingle();

  handleSupabaseError(error, "No se pudo verificar la asistencia del doctor.");
  return Boolean(data);
}
