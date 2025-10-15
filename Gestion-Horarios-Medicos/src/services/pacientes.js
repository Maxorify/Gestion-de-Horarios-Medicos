import { supabase } from "@/services/supabaseClient";

const PACIENTE_SELECT = `
  id,
  persona_id,
  estado,
  alerta_medica_general,
  personas:persona_id (
    id,
    nombre,
    apellido_paterno,
    rut,
    email,
    telefono
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

function mapPaciente(row) {
  if (!row) return null;
  const { personas, ...rest } = row;
  return {
    ...rest,
    persona: personas ?? null,
  };
}

async function obtenerPacientePorId(pacienteId, client = supabase) {
  const { data, error } = await client
    .from("pacientes")
    .select(PACIENTE_SELECT)
    .eq("id", pacienteId)
    .maybeSingle();

  handleSupabaseError(error, "No se pudo obtener la información del paciente.");
  return data ? mapPaciente(data) : null;
}

/**
 * Lista todos los pacientes junto con la información de la persona asociada.
 *
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function listarPacientes() {
  const { data, error } = await supabase
    .from("pacientes")
    .select(PACIENTE_SELECT)
    .order("id", { ascending: true });

  handleSupabaseError(error, "No se pudieron listar los pacientes.");
  return (data ?? []).map(mapPaciente);
}

/**
 * Crea un paciente mediante la transacción personas -> pacientes.
 *
 * @param {{ persona: Record<string, any>, paciente: Record<string, any> }} input
 * @returns {Promise<Record<string, any>>}
 */
export async function crearPaciente(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Los datos para crear un paciente son requeridos.");
  }

  const { persona, paciente } = input;
  if (!persona || !paciente) {
    throw new Error("El input debe incluir persona y paciente.");
  }

  const pacienteId = await supabase.transaction(async (tx) => {
    const { data: personaRow, error: personaError } = await tx
      .from("personas")
      .insert(persona)
      .select("id")
      .single();

    handleSupabaseError(personaError, "No se pudo crear la persona del paciente.");
    const personaId = personaRow?.id;
    if (!personaId) {
      throw new Error("La creación de la persona no devolvió un identificador válido.");
    }

    const pacientePayload = {
      ...paciente,
      persona_id: personaId,
      estado: paciente.estado ?? "activo",
    };

    const { data: pacienteRow, error: pacienteError } = await tx
      .from("pacientes")
      .insert(pacientePayload)
      .select("id")
      .single();

    handleSupabaseError(pacienteError, "No se pudo crear el registro del paciente.");

    const createdPacienteId = pacienteRow?.id;
    if (!createdPacienteId) {
      throw new Error("La creación del paciente no devolvió un identificador válido.");
    }

    return createdPacienteId;
  });

  const pacienteCompleto = await obtenerPacientePorId(pacienteId);
  if (!pacienteCompleto) {
    throw new Error("No se pudo recuperar el paciente recién creado.");
  }

  return pacienteCompleto;
}

/**
 * Actualiza un paciente y su persona asociada.
 *
 * @param {number|string} pacienteId
 * @param {{ persona?: Record<string, any>, paciente?: Record<string, any> }} input
 * @returns {Promise<Record<string, any>>}
 */
export async function actualizarPaciente(pacienteId, input = {}) {
  if (!pacienteId) {
    throw new Error("El identificador del paciente es requerido.");
  }
  if (!input || typeof input !== "object") {
    throw new Error("Los datos para actualizar el paciente son requeridos.");
  }

  const pacienteActual = await obtenerPacientePorId(pacienteId);
  if (!pacienteActual) {
    throw new Error("El paciente especificado no existe.");
  }

  const personaId = pacienteActual.persona_id;

  await supabase.transaction(async (tx) => {
    if (input.persona && Object.keys(input.persona).length > 0) {
      const { error } = await tx.from("personas").update(input.persona).eq("id", personaId);
      handleSupabaseError(error, "No se pudo actualizar la información personal del paciente.");
    }

    if (input.paciente && Object.keys(input.paciente).length > 0) {
      const updates = { ...input.paciente };
      delete updates.id;
      delete updates.persona_id;

      const { error } = await tx.from("pacientes").update(updates).eq("id", pacienteId);
      handleSupabaseError(error, "No se pudo actualizar la información del paciente.");
    }
  });

  const pacienteActualizado = await obtenerPacientePorId(pacienteId);
  if (!pacienteActualizado) {
    throw new Error("No se pudo recuperar la información del paciente actualizada.");
  }

  return pacienteActualizado;
}

/**
 * Desactiva un paciente estableciendo su estado como inactivo.
 *
 * @param {number|string} pacienteId
 * @returns {Promise<void>}
 */
export async function desactivarPaciente(pacienteId) {
  if (!pacienteId) {
    throw new Error("El identificador del paciente es requerido para desactivarlo.");
  }

  const pacienteActual = await obtenerPacientePorId(pacienteId);
  if (!pacienteActual) {
    throw new Error("El paciente especificado no existe.");
  }

  await supabase.transaction(async (tx) => {
    const { error } = await tx
      .from("pacientes")
      .update({ estado: "inactivo" })
      .eq("id", pacienteId);

    handleSupabaseError(error, "No se pudo desactivar el paciente.");
  });
}
