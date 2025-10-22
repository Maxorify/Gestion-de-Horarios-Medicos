import bcrypt from "bcryptjs";
import { supabase } from "@/services/supabaseClient";
import { fechaLocalISO } from "@/utils/fechaLocal";
import { cleanRutValue } from "@/utils/rut";

const SALT_ROUNDS = 10;

// Lista local de especialidades (sin tabla en BD)
export const SPECIALIDADES = [
  { id: 1, nombre: "Kinesiología" },
  { id: 2, nombre: "Fonoaudiología" },
  { id: 3, nombre: "Psicología" },
  { id: 4, nombre: "Nutricionista" },
  { id: 5, nombre: "Odontología" },
];

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

function generarPasswordTemporal() {
  const base = Math.random().toString(36).slice(-8);
  const upper = base.toUpperCase().slice(0, 2);
  const digits = String(Math.floor(100 + Math.random() * 900));
  return `${base}${upper}!${digits}`;
}

function normalizarPersona(persona) {
  if (!persona || typeof persona !== "object") {
    throw new Error("Los datos de la persona son requeridos.");
  }

  const nombre = persona.nombre?.trim();
  const apPat = persona.apellido_paterno?.trim();
  const apMat = persona.apellido_materno?.trim() || null;
  const rut = cleanRutValue(persona.rut);
  const email = persona.email?.trim();
  const tel1 = persona.telefono_principal?.trim() || null;
  const tel2 = persona.telefono_secundario?.trim() || null;
  const direccion = persona.direccion?.trim?.() || null;

  if (!nombre) throw new Error("Falta nombre de la persona");
  if (!apPat) throw new Error("Falta apellido paterno");
  if (!rut) throw new Error("Falta RUT");
  if (!email) throw new Error("Falta email");

  return {
    nombre,
    apellido_paterno: apPat,
    apellido_materno: apMat,
    rut,
    email,
    telefono_principal: tel1,
    telefono_secundario: tel2,
    direccion,
  };
}

function normalizarDoctor(doctor) {
  if (!doctor || typeof doctor !== "object") {
    throw new Error("Los datos del doctor son requeridos.");
  }
  const especialidad = doctor.especialidad_principal?.trim();
  if (!especialidad) throw new Error("Falta especialidad principal");
  return {
    especialidad_principal: especialidad,
    sub_especialidad: doctor.sub_especialidad?.trim?.() || doctor.subespecialidad?.trim?.() || null,
  };
}

// Devuelve la lista local (sin consultar BD)
export async function listarEspecialidadesPrincipales() {
  return SPECIALIDADES.slice();
}

async function obtenerDoctorPorId(doctorId, client = supabase) {
  const { data, error } = await client
    .from("doctores")
    .select(DOCTOR_SELECT)
    .eq("id", doctorId)
    .is("deleted_at", null)
    .is("personas.deleted_at", null)
    .maybeSingle();
  handleSupabaseError(error, "No se pudo obtener la información del doctor.");
  return data ? mapDoctor(data) : null;
}

export async function listarDoctores() {
  const { data, error } = await supabase
    .from("doctores")
    .select(DOCTOR_SELECT)
    .is("deleted_at", null)
    .is("personas.deleted_at", null)
    .order("id", { ascending: true });
  handleSupabaseError(error, "No se pudieron listar los doctores.");
  return (data ?? []).map(mapDoctor);
}

/**
 * @deprecated Usa crearDoctorConUsuario()
 */
export async function crearDoctor() {
  throw new Error("Usa crearDoctorConUsuario()");
}

export async function crearDoctorConUsuario(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Los datos para crear un doctor son requeridos.");
  }

  const persona = normalizarPersona(payload.persona);
  const doctor = {
    ...normalizarDoctor(payload.doctor),
    numero_licencia: payload.doctor?.numero_licencia?.trim?.() || null,
  };
  const passwordTemporal = payload.credenciales?.password?.trim() || generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordTemporal, SALT_ROUNDS);

  const { data, error } = await supabase.rpc("crear_doctor_y_usuario", {
    p_nombre: persona.nombre,
    p_apellido_paterno: persona.apellido_paterno,
    p_email: persona.email,
    p_especialidad_principal: doctor.especialidad_principal,
    p_apellido_materno: persona.apellido_materno ?? null,
    p_telefono: persona.telefono_principal ?? null,
    p_rut: persona.rut ?? null,
    p_sub_especialidad: doctor.sub_especialidad ?? null,
    p_numero_licencia: doctor.numero_licencia ?? null,
    p_password_hash: passwordHash,
    p_actor_uuid: payload.actor_uuid ?? null,
  });

  handleSupabaseError(error, "No se pudo crear el doctor.");

  const resultado = data ?? null;
  const personaId =
    resultado?.persona_id ?? resultado?.persona?.id ?? resultado?.doctor?.persona_id ?? null;
  const usuarioId =
    resultado?.usuario_id ?? resultado?.usuario_id_legacy ?? resultado?.usuario?.id ?? null;

  return {
    ...(resultado ?? {}),
    doctor: resultado?.doctor ?? null,
    persona:
      resultado?.persona ?? (personaId ? { id: personaId } : null),
    usuario:
      resultado?.usuario ?? (usuarioId ? { id: usuarioId } : null),
    passwordTemporal,
  };
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

  const timestamp = fechaLocalISO();

  const { error: doctorError } = await supabase
    .from("doctores")
    .update({ deleted_at: timestamp, estado: "inactivo" })
    .eq("id", doctorId);
  handleSupabaseError(doctorError, "No se pudo desactivar el doctor.");

  if (doctorActual.persona_id) {
    const { error: usuarioError } = await supabase
      .from("usuarios")
      .update({ estado: "inactivo", deleted_at: timestamp })
      .eq("persona_id", doctorActual.persona_id);
    handleSupabaseError(usuarioError, "No se pudo desactivar el usuario del doctor.");
  }
}
