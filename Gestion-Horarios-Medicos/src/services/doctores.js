import { supabase } from "@/services/supabaseClient";

/**
 * Lanza un Error envolviendo el error de Supabase provisto.
 *
 * @param {import("@supabase/supabase-js").PostgrestError | null} error
 * @param {string} fallbackMessage
 * @throws {Error}
 */
function throwSupabaseError(error, fallbackMessage) {
  if (!error) return;
  const message = error.message || fallbackMessage;
  const wrappedError = new Error(message);
  wrappedError.cause = error;
  throw wrappedError;
}

/**
 * Normaliza la estructura recibida desde Supabase para un doctor.
 *
 * @param {Record<string, any>} row
 * @returns {Record<string, any>}
 */
function mapDoctorRow(row) {
  if (!row) return row;
  const { personas, ...rest } = row;
  return {
    ...rest,
    persona: personas ?? null,
  };
}

/**
 * Obtiene la definición de selección base para doctores.
 *
 * @returns {string}
 */
function doctorSelectFields() {
  return `
    id,
    persona_id,
    estado,
    personas:persona_id (*)
  `;
}

/**
 * Recupera un doctor por su identificador, incluyendo su información personal.
 *
 * @param {number|string} doctorId
 * @returns {Promise<Record<string, any> | null>}
 */
async function obtenerDoctorPorId(doctorId) {
  const { data, error } = await supabase
    .from("doctores")
    .select(doctorSelectFields())
    .eq("id", doctorId)
    .maybeSingle();

  throwSupabaseError(error, "No se pudo obtener la información del doctor.");
  return data ? mapDoctorRow(data) : null;
}

/**
 * Lista todos los doctores activos junto con sus datos personales asociados.
 *
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function listarDoctores() {
  const { data, error } = await supabase
    .from("doctores")
    .select(doctorSelectFields())
    .eq("estado", "activo")
    .order("id", { ascending: true });

  throwSupabaseError(error, "No se pudieron listar los doctores activos.");
  return (data ?? []).map(mapDoctorRow);
}

/**
 * Crea un nuevo doctor siguiendo la transacción personas -> usuarios -> doctores.
 *
 * @param {{ persona: Record<string, any>, usuario: Record<string, any>, doctor: Record<string, any> }} input
 * @returns {Promise<Record<string, any>>}
 */
export async function crearDoctor(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Los datos para crear un doctor son requeridos.");
  }

  const { persona, usuario, doctor } = input;

  if (!persona || !usuario || !doctor) {
    throw new Error("El input debe contener los objetos persona, usuario y doctor.");
  }

  let personaId;
  let usuarioId;

  const { data: personaData, error: personaError } = await supabase
    .from("personas")
    .insert(persona)
    .select("id")
    .single();

  throwSupabaseError(personaError, "No se pudo crear el registro de la persona.");

  personaId = personaData?.id;
  if (!personaId) {
    throw new Error("La creación de la persona no devolvió un identificador válido.");
  }

  const { data: usuarioData, error: usuarioError } = await supabase
    .from("usuarios")
    .insert({ ...usuario, persona_id: personaId })
    .select("id")
    .single();

  try {
    throwSupabaseError(usuarioError, "No se pudo crear el usuario asociado al doctor.");
  } catch (error) {
    await supabase.from("personas").delete().eq("id", personaId);
    throw error;
  }

  usuarioId = usuarioData?.id;
  if (!usuarioId) {
    await supabase.from("usuarios").delete().eq("persona_id", personaId);
    await supabase.from("personas").delete().eq("id", personaId);
    throw new Error("La creación del usuario no devolvió un identificador válido.");
  }

  const doctorPayload = {
    ...doctor,
    persona_id: personaId,
  };

  if (!doctorPayload.estado) {
    doctorPayload.estado = "activo";
  }

  const { data: doctorRow, error: doctorError } = await supabase
    .from("doctores")
    .insert(doctorPayload)
    .select("id")
    .single();

  try {
    throwSupabaseError(doctorError, "No se pudo crear el registro del doctor.");
  } catch (error) {
    await supabase.from("usuarios").delete().eq("id", usuarioId);
    await supabase.from("personas").delete().eq("id", personaId);
    throw error;
  }

  const doctorId = doctorRow?.id;
  if (!doctorId) {
    throw new Error("La creación del doctor no devolvió un identificador válido.");
  }

  const doctorCompleto = await obtenerDoctorPorId(doctorId);
  if (!doctorCompleto) {
    throw new Error("No se pudo recuperar el doctor recién creado.");
  }

  return doctorCompleto;
}

/**
 * Actualiza los datos de un doctor y de su persona asociada.
 *
 * @param {number|string} doctorId
 * @param {{ persona?: Record<string, any>, doctor?: Record<string, any>, usuario?: Record<string, any> }} input
 * @returns {Promise<Record<string, any>>}
 */
export async function actualizarDoctor(doctorId, input = {}) {
  if (!doctorId) {
    throw new Error("El identificador del doctor es requerido.");
  }

  if (!input || typeof input !== "object") {
    throw new Error("Los datos para actualizar el doctor son requeridos.");
  }

  const currentDoctor = await obtenerDoctorPorId(doctorId);
  if (!currentDoctor) {
    throw new Error("El doctor especificado no existe.");
  }

  const personaId = currentDoctor.persona_id;

  if (input.persona && Object.keys(input.persona).length > 0) {
    const { error: personaUpdateError } = await supabase
      .from("personas")
      .update(input.persona)
      .eq("id", personaId);

    throwSupabaseError(personaUpdateError, "No se pudo actualizar la información personal del doctor.");
  }

  if (input.usuario && Object.keys(input.usuario).length > 0) {
    const { error: usuarioUpdateError } = await supabase
      .from("usuarios")
      .update(input.usuario)
      .eq("persona_id", personaId);

    throwSupabaseError(usuarioUpdateError, "No se pudo actualizar el usuario del doctor.");
  }

  if (input.doctor && Object.keys(input.doctor).length > 0) {
    const doctorUpdates = { ...input.doctor };
    delete doctorUpdates.id;
    delete doctorUpdates.persona_id;

    const { error: doctorUpdateError } = await supabase
      .from("doctores")
      .update(doctorUpdates)
      .eq("id", doctorId);

    throwSupabaseError(doctorUpdateError, "No se pudo actualizar la información del doctor.");
  }

  const updatedDoctor = await obtenerDoctorPorId(doctorId);
  if (!updatedDoctor) {
    throw new Error("No se pudo recuperar la información actualizada del doctor.");
  }

  return updatedDoctor;
}

/**
 * Cambia el estado del doctor y del usuario asociado a "inactivo".
 *
 * @param {number|string} doctorId
 * @returns {Promise<void>}
 */
export async function desactivarDoctor(doctorId) {
  if (!doctorId) {
    throw new Error("El identificador del doctor es requerido para desactivarlo.");
  }

  const doctorActual = await obtenerDoctorPorId(doctorId);
  if (!doctorActual) {
    throw new Error("El doctor especificado no existe o ya fue desactivado.");
  }

  const personaId = doctorActual.persona_id;

  const { error: doctorError } = await supabase
    .from("doctores")
    .update({ estado: "inactivo" })
    .eq("id", doctorId);

  throwSupabaseError(doctorError, "No se pudo desactivar el doctor.");

  const { error: usuarioError } = await supabase
    .from("usuarios")
    .update({ estado: "inactivo" })
    .eq("persona_id", personaId);

  throwSupabaseError(usuarioError, "No se pudo desactivar el usuario asociado al doctor.");
}

