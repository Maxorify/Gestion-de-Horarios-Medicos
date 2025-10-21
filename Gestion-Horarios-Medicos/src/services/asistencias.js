import { supabase } from "@/services/supabaseClient";
import { fechaLocalISO, fechaLocalYYYYMMDD } from "@/utils/fechaLocal";

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
  const iso = fechaLocalISO();
  return {
    fecha: fechaLocalYYYYMMDD(),
    hora: iso.slice(11, 19),
    iso,
  };
}

export async function yaTieneAsistenciaHoy(doctorId) {
  if (!doctorId) {
    throw new Error("El identificador del doctor es obligatorio");
  }
  const fecha = fechaLocalYYYYMMDD();
  const { data, error } = await supabase
    .from("asistencias")
    .select("id, doctor_id, fecha_asistencia, hora_llegada")
    .eq("doctor_id", doctorId)
    .eq("fecha_asistencia", fecha)
    .is("deleted_at", null)
    .maybeSingle();

  handleSupabaseError(error, "No se pudo consultar la asistencia registrada");
  return data ?? null;
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

  const asistenciaExistente = await yaTieneAsistenciaHoy(doctorId);
  if (asistenciaExistente) {
    return { ...asistenciaExistente, repetida: true };
  }

  const { fecha, hora } = obtenerMarcaTemporalActual();

  const { data, error } = await supabase
    .from("asistencias")
    .insert({
      doctor_id: doctorId,
      fecha_asistencia: fecha,
      hora_llegada: hora,
    })
    .select("id, doctor_id, fecha_asistencia, hora_llegada")
    .maybeSingle();

  handleSupabaseError(error, "No se pudo registrar la asistencia del doctor.");
  return data;
}

export async function verificarAsistencia(doctorId, fecha) {
  if (!doctorId) {
    throw new Error("El identificador del doctor es requerido para verificar la asistencia.");
  }
  if (!fecha) {
    throw new Error("La fecha es requerida para verificar la asistencia.");
  }

  const fechaConsulta = fechaLocalYYYYMMDD(fecha);

  const { data, error } = await supabase
    .from("asistencias")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("fecha_asistencia", fechaConsulta)
    .is("deleted_at", null)
    .maybeSingle();

  handleSupabaseError(error, "No se pudo verificar la asistencia del doctor.");
  return Boolean(data);
}
