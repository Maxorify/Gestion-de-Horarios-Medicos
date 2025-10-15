import { supabase } from "@/services/supabaseClient";

const DOCTOR_SELECT = `
  id,
  persona_id,
  especialidad_principal,
  estado,
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

function mapDoctor(row) {
  if (!row) return null;
  const { personas, ...rest } = row;
  return {
    ...rest,
    persona: personas ?? null,
  };
}

async function obtenerDoctorPorId(doctorId, client = supabase) {
  const { data, error } = await client
    .from("doctores")
    .select(DOCTOR_SELECT)
    .eq("id", doctorId)
    .maybeSingle();

  handleSupabaseError(error, "No se pudo obtener la información del doctor.");
  return data ? mapDoctor(data) : null;
}

/**
 * Lista todos los doctores ordenados por su identificador incluyendo su persona.
 *
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function listarDoctores() {
  const { data, error } = await supabase
    .from("doctores")
    .select(DOCTOR_SELECT)
    .order("id", { ascending: true });

  handleSupabaseError(error, "No se pudieron listar los doctores.");
  return (data ?? []).map(mapDoctor);
}

/**
 * Crea un doctor mediante la transacción personas -> usuarios -> doctores.
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
    throw new Error("El input debe incluir persona, usuario y doctor.");
  }

  const doctorId = await supabase.transaction(async (tx) => {
    const { data: personaRow, error: personaError } = await tx
      .from("personas")
      .insert(persona)
      .select("id")
      .single();

    handleSupabaseError(personaError, "No se pudo crear la persona del doctor.");
    const personaId = personaRow?.id;
    if (!personaId) {
      throw new Error("La creación de la persona no devolvió un identificador válido.");
    }

    const { data: usuarioRow, error: usuarioError } = await tx
      .from("usuarios")
      .insert({ ...usuario, persona_id: personaId })
      .select("id")
      .single();

    handleSupabaseError(usuarioError, "No se pudo crear el usuario del doctor.");

    const doctorPayload = {
      ...doctor,
      persona_id: personaId,
      estado: doctor.estado ?? "activo",
    };

    const { data: doctorRow, error: doctorError } = await tx
      .from("doctores")
      .insert(doctorPayload)
      .select("id")
      .single();

    handleSupabaseError(doctorError, "No se pudo crear el registro del doctor.");

    const createdDoctorId = doctorRow?.id;
    if (!createdDoctorId) {
      throw new Error("La creación del doctor no devolvió un identificador válido.");
    }

    return createdDoctorId;
  });

  const doctorCompleto = await obtenerDoctorPorId(doctorId);
  if (!doctorCompleto) {
    throw new Error("No se pudo recuperar el doctor recién creado.");
  }

  return doctorCompleto;
}

/**
 * Actualiza la persona, usuario o doctor asociado a un médico.
 *
 * @param {number|string} doctorId
 * @param {{ persona?: Record<string, any>, usuario?: Record<string, any>, doctor?: Record<string, any> }} input
 * @returns {Promise<Record<string, any>>}
 */
export async function actualizarDoctor(doctorId, input = {}) {
  if (!doctorId) {
    throw new Error("El identificador del doctor es requerido.");
  }
  if (!input || typeof input !== "object") {
    throw new Error("Los datos para actualizar el doctor son requeridos.");
  }

  const doctorActual = await obtenerDoctorPorId(doctorId);
  if (!doctorActual) {
    throw new Error("El doctor especificado no existe.");
  }

  const personaId = doctorActual.persona_id;

  await supabase.transaction(async (tx) => {
    if (input.persona && Object.keys(input.persona).length > 0) {
      const { error } = await tx.from("personas").update(input.persona).eq("id", personaId);
      handleSupabaseError(error, "No se pudo actualizar la información personal del doctor.");
    }

    if (input.usuario && Object.keys(input.usuario).length > 0) {
      const { error } = await tx.from("usuarios").update(input.usuario).eq("persona_id", personaId);
      handleSupabaseError(error, "No se pudo actualizar el usuario del doctor.");
    }

    if (input.doctor && Object.keys(input.doctor).length > 0) {
      const updates = { ...input.doctor };
      delete updates.id;
      delete updates.persona_id;

      const { error } = await tx.from("doctores").update(updates).eq("id", doctorId);
      handleSupabaseError(error, "No se pudo actualizar la información del doctor.");
    }
  });

  const doctorActualizado = await obtenerDoctorPorId(doctorId);
  if (!doctorActualizado) {
    throw new Error("No se pudo recuperar la información del doctor actualizada.");
  }

  return doctorActualizado;
}

/**
 * Desactiva un doctor junto con su usuario asociado.
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
    throw new Error("El doctor especificado no existe.");
  }

  const personaId = doctorActual.persona_id;

  await supabase.transaction(async (tx) => {
    const { error: doctorError } = await tx
      .from("doctores")
      .update({ estado: "inactivo" })
      .eq("id", doctorId);

    handleSupabaseError(doctorError, "No se pudo desactivar el doctor.");

    const { error: usuarioError } = await tx
      .from("usuarios")
      .update({ estado: "inactivo" })
      .eq("persona_id", personaId);

    handleSupabaseError(usuarioError, "No se pudo desactivar el usuario asociado al doctor.");
  });
}
