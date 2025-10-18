import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { supabase } from "@/services/supabaseClient";

dayjs.extend(utc);

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
    query = query.lt("fecha_hora_fin", fechaFin);
  }

  const { data, error } = await query;
  handleSupabaseError(error, "No se pudo listar la disponibilidad del doctor.");

  if (!data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    doctor_id: item.doctor_id,
    fecha_hora_inicio: item.fecha_hora_inicio,
    fecha_hora_fin: item.fecha_hora_fin,
    duracion_bloque_minutos: item.duracion_bloque_minutos,
  }));
}

/**
 * Elimina una disponibilidad por su identificador.
 *
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export async function eliminarDisponibilidad(id) {
  if (!id) {
    throw new Error("El identificador de la disponibilidad es requerido.");
  }

  const { error } = await supabase.from("disponibilidad").delete().eq("id", id);
  handleSupabaseError(error, "No se pudo eliminar la disponibilidad.");
}

/**
 * Actualiza campos de una disponibilidad.
 *
 * @param {number|string} id
 * @param {{ fecha_hora_inicio?: string, fecha_hora_fin?: string, duracion_bloque_minutos?: number, estado?: string }} patch
 * @returns {Promise<Record<string, any> | void>}
 */
export async function actualizarDisponibilidad(id, patch) {
  if (!id) {
    throw new Error("El identificador de la disponibilidad es requerido.");
  }

  if (!patch || typeof patch !== "object" || Object.keys(patch).length === 0) {
    throw new Error("Se requiere al menos un campo para actualizar.");
  }

  const { data, error } = await supabase
    .from("disponibilidad")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  handleSupabaseError(error, "No se pudo actualizar la disponibilidad.");
  return data;
}

/**
 * Calcula el rango de una semana [inicio, fin) en UTC.
 *
 * @param {import("dayjs").Dayjs} fechaDayjs
 * @returns {[string, string]}
 */
export function rangoSemana(fechaDayjs) {
  if (!fechaDayjs) {
    throw new Error("Se requiere una fecha para calcular el rango semanal.");
  }

  const inicioLocal = fechaDayjs.startOf("day");
  const finLocal = inicioLocal.add(7, "day");

  return [inicioLocal.utc().toISOString(), finLocal.utc().toISOString()];
}

/**
 * Determina si un rango se solapa con una lista de disponibilidades existentes.
 *
 * @param {string | import("dayjs").Dayjs} nuevoInicio
 * @param {string | import("dayjs").Dayjs} nuevoFin
 * @param {Array<{ fecha_hora_inicio: string | import("dayjs").Dayjs, fecha_hora_fin: string | import("dayjs").Dayjs }>} listaExistente
 * @returns {boolean}
 */
export function haySolape(nuevoInicio, nuevoFin, listaExistente = []) {
  if (!nuevoInicio || !nuevoFin) {
    return false;
  }

  const inicio = dayjs(nuevoInicio);
  const fin = dayjs(nuevoFin);

  if (!fin.isAfter(inicio)) {
    return true;
  }

  return listaExistente.some((item) => {
    const existenteInicio = dayjs(item.fecha_hora_inicio);
    const existenteFin = dayjs(item.fecha_hora_fin);

    return inicio.isBefore(existenteFin) && fin.isAfter(existenteInicio);
  });
}
