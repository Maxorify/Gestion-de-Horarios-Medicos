import { supabase } from "@/services/supabaseClient";

const DOCTOR_SELECT = `
  id, persona_id, especialidad_principal, estado,
  personas:persona_id (
    id, nombre, apellido_paterno, apellido_materno, rut, email,
    telefono_principal, telefono_secundario
  )
`;

function handleSupabaseError(error, fallbackMessage) {
  if (!error) return;
  const message = error.message || fallbackMessage || "Error inesperado de Supabase";
  const wrapped = new Error(message);
  wrapped.cause = error;
  throw wrapped;
}

function mapDoctor(row) {
  if (!row) return null;
  const { personas, ...rest } = row;
  const persona = personas ?? null;

  return {
    ...rest,
    persona,
    nombre: persona
      ? [persona.nombre, persona.apellido_paterno, persona.apellido_materno].filter(Boolean).join(" ")
      : "",
    email: persona?.email ?? "",
    especialidades: rest.especialidad_principal ?? "",
  };
}

export async function listarEspecialidadesPrincipales(options = {}) {
  const client = options.client ?? supabase;
  const { data, error } = await client
    .from("especialidades")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  handleSupabaseError(error, "No se pudieron listar las especialidades.");
  return (data ?? []).map(({ id, nombre, ...rest }) => ({ id, nombre, ...rest }));
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

export async function listarDoctores() {
  const { data, error } = await supabase
    .from("doctores")
    .select(DOCTOR_SELECT)
    .order("id", { ascending: true });

  handleSupabaseError(error, "No se pudieron listar los doctores.");
  return (data ?? []).map(mapDoctor);
}

/**
 * Crea persona y doctor. NO toca 'usuarios' desde el cliente.
 * Si falla crear el doctor, borra la persona creada (rollback compensatorio).
 */
export async function crearDoctor(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Los datos para crear un doctor son requeridos.");
  }
  const { persona, doctor } = payload;
  if (!persona || !doctor) {
    throw new Error("El input debe incluir persona y doctor.");
  }

  // Validaciones mínimas del esquema actual
  if (!persona.nombre?.trim()) throw new Error("Falta nombre de la persona");
  if (!persona.apellido_paterno?.trim()) throw new Error("Falta apellido paterno");
  if (!persona.rut?.trim()) throw new Error("Falta RUT");
  if (!persona.email?.trim()) throw new Error("Falta email");
  if (!doctor.especialidad_principal?.trim()) throw new Error("Falta especialidad principal");

  // 1) Crear persona
  const { data: personaRow, error: personaErr } = await supabase
    .from("personas")
    .insert([{
      nombre: persona.nombre.trim(),
      apellido_paterno: persona.apellido_paterno.trim(),
      apellido_materno: persona.apellido_materno?.trim() || null,
      rut: persona.rut.trim(),
      email: persona.email.trim(),
      telefono_principal: persona.telefono_principal?.trim() || null,
      telefono_secundario: persona.telefono_secundario?.trim() || null,
      direccion: persona.direccion?.trim?.() || null
    }])
    .select("id")
    .maybeSingle();

  handleSupabaseError(personaErr, "No se pudo crear la persona del doctor.");
  const personaId = personaRow?.id;
  if (!personaId) throw new Error("La creación de la persona no devolvió un identificador válido.");

  try {
    // 2) Crear doctor
    const { data: docRow, error: docErr } = await supabase
      .from("doctores")
      .insert([{
        persona_id: personaId,
        especialidad_principal: doctor.especialidad_principal.trim(),
        sueldo_base_mensual: doctor.sueldo_base_mensual ?? null,
        estado: "activo",
      }])
      .select(DOCTOR_SELECT)
      .maybeSingle();

    handleSupabaseError(docErr, "No se pudo crear el registro del doctor.");
    return mapDoctor(docRow);
  } catch (e) {
    await supabase.from("personas").delete().eq("id", personaId);
    throw e;
  }
}

export async function actualizarDoctor(doctorId, input = {}) {
  if (!doctorId) throw new Error("El identificador del doctor es requerido.");
  if (!input || typeof input !== "object") throw new Error("Los datos para actualizar el doctor son requeridos.");

  const doctorActual = await obtenerDoctorPorId(doctorId);
  if (!doctorActual) throw new Error("El doctor especificado no existe.");
  const personaId = doctorActual.persona_id;

  if (input.persona && Object.keys(input.persona).length > 0) {
    const { error } = await supabase.from("personas").update(input.persona).eq("id", personaId);
    handleSupabaseError(error, "No se pudo actualizar la información personal del doctor.");
  }

  // No tocar usuarios desde cliente

  if (input.doctor && Object.keys(input.doctor).length > 0) {
    const updates = { ...input.doctor };
    delete updates.id;
    delete updates.persona_id;
    const { error } = await supabase.from("doctores").update(updates).eq("id", doctorId);
    handleSupabaseError(error, "No se pudo actualizar la información del doctor.");
  }

  const doctorActualizado = await obtenerDoctorPorId(doctorId);
  if (!doctorActualizado) throw new Error("No se pudo recuperar la información del doctor actualizada.");
  return doctorActualizado;
}

export async function desactivarDoctor(doctorId) {
  if (!doctorId) throw new Error("El identificador del doctor es requerido para desactivarlo.");
  const doctorActual = await obtenerDoctorPorId(doctorId);
  if (!doctorActual) throw new Error("El doctor especificado no existe.");

  const { error: doctorError } = await supabase
    .from("doctores")
    .update({ estado: "inactivo" })
    .eq("id", doctorId);
  handleSupabaseError(doctorError, "No se pudo desactivar el doctor.");

  // No tocar usuarios aquí
}
