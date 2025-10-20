import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { supabase } from "@/services/supabaseClient";
import { fechaLocalISO, ZONA_HORARIA_CHILE } from "@/utils/fechaLocal";

dayjs.extend(utc);
dayjs.extend(timezone);

const ESTADOS_ACTIVOS = ["programada", "confirmada", "pendiente"];

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
  const base = dayjs.tz(`${fecha}T00:00:00`, ZONA_HORARIA_CHILE, true);
  if (!base.isValid()) {
    throw new Error("La fecha proporcionada no es válida.");
  }
  const start = base.startOf("day");
  const end = start.add(1, "day");
  return {
    start: start.format("YYYY-MM-DDTHH:mm:ss.SSS"),
    end: end.format("YYYY-MM-DDTHH:mm:ss.SSS"),
  };
}

function normalizarISO(fecha) {
  if (!fecha) {
    return fecha;
  }
  return fechaLocalISO(fecha);
}

async function obtenerCitaPorId(citaId, client = supabase) {
  const { data, error } = await client
    .from("citas")
    .select(CITA_SELECT)
    .eq("id", citaId)
    .is("deleted_at", null)
    .is("pacientes.deleted_at", null)
    .is("doctores.deleted_at", null)
    .is("disponibilidad.deleted_at", null)
    .maybeSingle();

  handleSupabaseError(error, "No se pudo obtener la información de la cita.");
  return data ?? null;
}

/**
 * Crea una nueva cita.
 *
 * @param {{ paciente_id: number|string, doctor_id: number|string, disponibilidad_id: number|string, creada_por_usuario_id: string, estado?: string }} input
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

  const payload = { ...input };
  if (payload.fecha_hora_inicio_agendada) {
    payload.fecha_hora_inicio_agendada = normalizarISO(payload.fecha_hora_inicio_agendada);
  }
  if (payload.fecha_hora_fin_agendada) {
    payload.fecha_hora_fin_agendada = normalizarISO(payload.fecha_hora_fin_agendada);
  }

  const { data, error } = await supabase
    .from("citas")
    .insert({
      ...payload,
      estado: payload.estado ?? "programada",
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
    .is("deleted_at", null)
    .is("pacientes.deleted_at", null)
    .is("doctores.deleted_at", null)
    .is("disponibilidad.deleted_at", null)
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
    .is("deleted_at", null)
    .is("pacientes.deleted_at", null)
    .is("doctores.deleted_at", null)
    .is("disponibilidad.deleted_at", null)
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
    .update({ estado: nuevoEstado, updated_at: fechaLocalISO() })
    .eq("id", citaId)
    .is("deleted_at", null);

  handleSupabaseError(error, "No se pudo actualizar el estado de la cita.");

  const citaActualizada = await obtenerCitaPorId(citaId);
  if (!citaActualizada) {
    throw new Error("No se pudo recuperar la cita actualizada.");
  }

  return citaActualizada;
}

export async function obtenerCitaActivaDePaciente(pacienteId) {
  if (!pacienteId) {
    throw new Error("El identificador del paciente es requerido.");
  }

  const { data, error } = await supabase
    .from("citas")
    .select(
      "id, estado, doctor_id, disponibilidad_id, fecha_hora_inicio_agendada, fecha_hora_fin_agendada",
    )
    .eq("paciente_id", pacienteId)
    .in("estado", ESTADOS_ACTIVOS)
    .is("deleted_at", null)
    .maybeSingle();

  handleSupabaseError(error, "No se pudo obtener la cita activa del paciente.");
  return data || null;
}

export async function reservarCita({ paciente_id, doctor_id, disponibilidad_id, inicioISO, finISO }) {
  const { data, error } = await supabase
    .from("citas")
    .insert([
      {
        paciente_id,
        doctor_id,
        disponibilidad_id,
        fecha_hora_inicio_agendada: normalizarISO(inicioISO),
        fecha_hora_fin_agendada: normalizarISO(finISO),
        estado: "programada",
      },
    ])
    .select()
    .maybeSingle();

  handleSupabaseError(error, "No se pudo reservar la cita.");
  return data;
}

export async function cancelarCita(citaId, motivo = "cancelada por reprogramación") {
  if (!citaId) {
    throw new Error("El identificador de la cita es requerido.");
  }

  const { error } = await supabase
    .from("citas")
    .update({
      estado: "cancelada",
      updated_at: fechaLocalISO(),
      notas_administrativas: motivo,
    })
    .eq("id", citaId)
    .is("deleted_at", null);

  handleSupabaseError(error, "No se pudo cancelar la cita.");
}

export async function borrarCita(citaId) {
  if (!citaId) {
    throw new Error("El identificador de la cita es requerido para borrarla.");
  }

  const { error } = await supabase
    .from("citas")
    .update({ deleted_at: fechaLocalISO() })
    .eq("id", citaId);

  handleSupabaseError(error, "No se pudo borrar la cita.");
}

export async function reprogramarCita(citaId, { disponibilidad_id, inicioISO, finISO }) {
  if (!citaId) {
    throw new Error("El identificador de la cita es requerido.");
  }

  const { data, error } = await supabase
    .from("citas")
    .update({
      disponibilidad_id,
      fecha_hora_inicio_agendada: normalizarISO(inicioISO),
      fecha_hora_fin_agendada: normalizarISO(finISO),
      updated_at: fechaLocalISO(),
    })
    .eq("id", citaId)
    .is("deleted_at", null)
    .select()
    .maybeSingle();

  handleSupabaseError(error, "No se pudo reprogramar la cita.");
  return data;
}

export async function reservarOCambiar({
  paciente_id,
  doctor_id,
  disponibilidad_id,
  inicioISO,
  finISO,
  reprogramarSiExiste = false,
}) {
  if (!paciente_id || !doctor_id || !disponibilidad_id || !inicioISO || !finISO) {
    throw new Error("paciente_id, doctor_id, disponibilidad_id, inicioISO y finISO son obligatorios.");
  }

  const vigente = await obtenerCitaActivaDePaciente(paciente_id);
  if (vigente) {
    if (!reprogramarSiExiste) {
      const error = new Error("El paciente ya tiene una cita activa.");
      error.code = "CITA_ACTIVA";
      error.cita = vigente;
      throw error;
    }
    return reprogramarCita(vigente.id, { disponibilidad_id, inicioISO, finISO });
  }

  return reservarCita({ paciente_id, doctor_id, disponibilidad_id, inicioISO, finISO });
}
