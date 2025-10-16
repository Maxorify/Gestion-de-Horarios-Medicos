import { supabase } from "@/services/supabaseClient";

const CITA_SELECT = `
  id,
  paciente_id,
  doctor_id,
  disponibilidad_id,
  creada_por_usuario_id,
  estado,
  created_at,
  pacientes:paciente_id (
    id,
    persona_id,
    personas:persona_id (
      id,
      nombre,
      apellido_paterno,
      rut,
      email,
      telefono_principal,
      telefono_secundario
    )
  ),
  doctores:doctor_id (
    id,
    persona_id,
    personas:persona_id (
      id,
      nombre,
      apellido_paterno,
      rut,
      email,
      telefono_principal,
      telefono_secundario
    )
  ),
  disponibilidad:disponibilidad_id (
    id,
    doctor_id,
    fecha_hora_inicio,
    fecha_hora_fin,
    duracion_bloque_minutos
  )
`;

function handleSupabaseError(error, fallbackMessage) {
  if (!error) {
    return;
  }
  const message = error.message || fallbackMessage || "Error inesperado de Supabase";
  const wrapped = new Error(message);
  wrapped.cause = error;
  throw wrapped;
}

function buildDayRange(fecha) {
  if (!fecha) {
    throw new Error("La fecha es requerida para filtrar.");
  }
  const date = new Date(`${fecha}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("La fecha proporcionada no es válida.");
  }
  const start = date.toISOString();
  const end = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString();
  return { start, end };
}

async function obtenerCitaPorId(citaId, client = supabase) {
  const { data, error } = await client
    .from("citas")
    .select(CITA_SELECT)
    .eq("id", citaId)
    .maybeSingle();

  handleSupabaseError(error, "No se pudo obtener la información de la cita.");
  return data ?? null;
}

/**
 * Crea una nueva cita.
 *
 * @param {{ paciente_id: number|string, doctor_id: number|string, disponibilidad_id: number|string, creada_por_usuario_id: number|string, estado?: string }} input
 * @returns {Promise<Record<string, any>>}
 */
export async function crearCita(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Los datos para crear la cita son requeridos.");
  }

  const { paciente_id, doctor_id, disponibilidad_id, creada_por_usuario_id } = input;
  if (!paciente_id || !doctor_id || !disponibilidad_id || !creada_por_usuario_id) {
    throw new Error("paciente_id, doctor_id, disponibilidad_id y creada_por_usuario_id son obligatorios.");
  }

  const { data, error } = await supabase
    .from("citas")
    .insert({
      ...input,
      estado: input.estado ?? "programada",
    })
    .select("id")
    .single();

  handleSupabaseError(error, "No se pudo crear la cita.");
  const citaId = data?.id;
  if (!citaId) {
    throw new Error("La creación de la cita no devolvió un identificador válido.");
  }

  const citaCompleta = await obtenerCitaPorId(citaId);
  if (!citaCompleta) {
    throw new Error("No se pudo recuperar la cita recién creada.");
  }

  return citaCompleta;
}

/**
 * Lista las citas de un doctor para un día específico.
 *
 * @param {number|string} doctorId
 * @param {string} fecha
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function listarCitasPorDoctor(doctorId, fecha) {
  if (!doctorId) {
    throw new Error("El identificador del doctor es requerido.");
  }
  const { start, end } = buildDayRange(fecha);

  const { data, error } = await supabase
    .from("citas")
    .select(CITA_SELECT)
    .eq("doctor_id", doctorId)
    .gte("disponibilidad.fecha_hora_inicio", start)
    .lt("disponibilidad.fecha_hora_inicio", end)
    .order("fecha_hora_inicio", { ascending: true, foreignTable: "disponibilidad" });

  handleSupabaseError(error, "No se pudieron listar las citas del doctor.");
  return data ?? [];
}

/**
 * Lista el historial de citas de un paciente.
 *
 * @param {number|string} pacienteId
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function listarCitasPorPaciente(pacienteId) {
  if (!pacienteId) {
    throw new Error("El identificador del paciente es requerido.");
  }

  const { data, error } = await supabase
    .from("citas")
    .select(CITA_SELECT)
    .eq("paciente_id", pacienteId)
    .order("fecha_hora_inicio", {
      ascending: false,
      nullsFirst: false,
      foreignTable: "disponibilidad",
    });

  handleSupabaseError(error, "No se pudo obtener el historial de citas del paciente.");
  return data ?? [];
}

/**
 * Actualiza el estado de una cita.
 *
 * @param {number|string} citaId
 * @param {string} nuevoEstado
 * @returns {Promise<Record<string, any>>}
 */
export async function actualizarEstadoCita(citaId, nuevoEstado) {
  if (!citaId) {
    throw new Error("El identificador de la cita es requerido.");
  }
  if (!nuevoEstado) {
    throw new Error("El nuevo estado es requerido.");
  }

  const { error } = await supabase
    .from("citas")
    .update({ estado: nuevoEstado })
    .eq("id", citaId);

  handleSupabaseError(error, "No se pudo actualizar el estado de la cita.");

  const citaActualizada = await obtenerCitaPorId(citaId);
  if (!citaActualizada) {
    throw new Error("No se pudo recuperar la cita actualizada.");
  }

  return citaActualizada;
}
