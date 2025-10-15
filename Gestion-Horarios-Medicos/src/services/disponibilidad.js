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

/**
 * Crea una nueva disponibilidad para un doctor.
 *
 * @param {{ doctor_id: number|string, fecha_hora_inicio: string, fecha_hora_fin: string, duracion_bloque_minutos: number }} input
 * @returns {Promise<Record<string, any>>}
 */
export async function crearDisponibilidad(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Los datos de la disponibilidad son requeridos.");
  }

  const { doctor_id, fecha_hora_inicio, fecha_hora_fin, duracion_bloque_minutos } = input;
  if (!doctor_id || !fecha_hora_inicio || !fecha_hora_fin || !duracion_bloque_minutos) {
    throw new Error("doctor_id, fecha_hora_inicio, fecha_hora_fin y duracion_bloque_minutos son obligatorios.");
  }

  const { data, error } = await supabase
    .from("disponibilidad")
    .insert({
      doctor_id,
      fecha_hora_inicio,
      fecha_hora_fin,
      duracion_bloque_minutos,
    })
    .select()
    .single();

  handleSupabaseError(error, "No se pudo crear la disponibilidad.");
  return data;
}

/**
 * Lista la disponibilidad de un doctor en un rango de fechas.
 *
 * @param {number|string} doctorId
 * @param {string | undefined} fechaInicio
 * @param {string | undefined} fechaFin
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function listarDisponibilidadPorDoctor(doctorId, fechaInicio, fechaFin) {
  if (!doctorId) {
    throw new Error("El identificador del doctor es requerido.");
  }

  let query = supabase
    .from("disponibilidad")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("fecha_hora_inicio", { ascending: true });

  if (fechaInicio) {
    query = query.gte("fecha_hora_inicio", fechaInicio);
  }

  if (fechaFin) {
    query = query.lte("fecha_hora_fin", fechaFin);
  }

  const { data, error } = await query;
  handleSupabaseError(error, "No se pudo listar la disponibilidad del doctor.");

  return data ?? [];
}
