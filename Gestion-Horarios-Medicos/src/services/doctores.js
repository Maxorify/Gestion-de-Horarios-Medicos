import bcrypt from "bcryptjs";
import { supabase } from "@/services/supabaseClient";
import { getSession } from "@/services/authLocal";
import { fechaLocalISO } from "@/utils/fechaLocal";
import { cleanRutValue } from "@/utils/rut";

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
  const doctor = normalizarDoctor(payload.doctor);
  const passwordPlain = payload.credenciales?.password?.trim() || generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordPlain, 10);
  const email = persona.email;
  const session = (typeof getSession === "function" ? getSession() : {}) || {};
  const SYSTEM_UUID = "00000000-0000-0000-0000-000000000001";
  const actorUuid = payload.actor_uuid ?? session?.usuario_id ?? SYSTEM_UUID;

  let personaId;
  let doctorId;
  let usuarioId;
  let doctorRow;
  let personaCreada = false;
  let doctorCreado = false;
  let usuarioCreado = false;

  const { data: personaExistente, error: personaFindErr } = await supabase
    .from("personas")
    .select("id, deleted_at")
    .or(`email.eq.${email},rut.eq.${persona.rut}`)
    .maybeSingle();
  handleSupabaseError(personaFindErr, "No se pudo validar duplicados de persona");

  const personaPrev = personaExistente ? { id: personaExistente.id, deleted_at: personaExistente.deleted_at } : null;

  let doctorExistente = null;
  if (personaExistente?.id) {
    const { data: doctorEncontrado, error: doctorFindErr } = await supabase
      .from("doctores")
      .select("id, deleted_at, estado, especialidad_principal, sub_especialidad")
      .eq("persona_id", personaExistente.id)
      .maybeSingle();
    handleSupabaseError(doctorFindErr, "No se pudo verificar si la persona ya es doctor.");
    doctorExistente = doctorEncontrado ?? null;
    if (doctorExistente && !doctorExistente.deleted_at && doctorExistente.estado !== "inactivo") {
      throw new Error("La persona ya tiene un doctor activo asociado.");
    }
  }

  const doctorPrev = doctorExistente
    ? {
        id: doctorExistente.id,
        deleted_at: doctorExistente.deleted_at,
        estado: doctorExistente.estado,
        especialidad_principal: doctorExistente.especialidad_principal,
        sub_especialidad: doctorExistente.sub_especialidad,
      }
    : null;

  let usuarioPrev = null;

  try {
    if (personaExistente?.id) {
      personaId = personaExistente.id;
      const { error: personaUpdateErr } = await supabase
        .from("personas")
        .update({
          nombre: persona.nombre,
          apellido_paterno: persona.apellido_paterno,
          apellido_materno: persona.apellido_materno,
          rut: persona.rut,
          email: persona.email,
          telefono_principal: persona.telefono_principal,
          telefono_secundario: persona.telefono_secundario,
          direccion: persona.direccion,
          deleted_at: null,
        })
        .eq("id", personaId);
      handleSupabaseError(personaUpdateErr, "No se pudo actualizar la persona existente.");
    } else {
      const { data: personaRow, error: personaErr } = await supabase
        .from("personas")
        .insert([persona])
        .select("id")
        .maybeSingle();
      handleSupabaseError(personaErr, "No se pudo crear la persona del doctor.");
      personaId = personaRow?.id;
      if (!personaId) throw new Error("La creación de la persona no devolvió un identificador válido.");
      personaCreada = true;
    }

    if (!personaId) throw new Error("No se obtuvo un identificador de persona válido.");

    if (!doctorExistente && !personaCreada) {
      const { data: doctorEncontrado, error: doctorFindErr } = await supabase
        .from("doctores")
        .select("id, deleted_at, estado, especialidad_principal, sub_especialidad")
        .eq("persona_id", personaId)
        .maybeSingle();
      handleSupabaseError(doctorFindErr, "No se pudo verificar si la persona ya es doctor.");
      doctorExistente = doctorEncontrado ?? null;
      if (doctorExistente && !doctorExistente.deleted_at && doctorExistente.estado !== "inactivo") {
        throw new Error("La persona ya tiene un doctor activo asociado.");
      }
    }

    if (doctorExistente?.id) {
      const { data: doctorRowActualizado, error: doctorUpdateErr } = await supabase
        .from("doctores")
        .update({
          especialidad_principal: doctor.especialidad_principal,
          sub_especialidad: doctor.sub_especialidad ?? null,
          estado: "activo",
          deleted_at: null,
        })
        .eq("id", doctorExistente.id)
        .select(DOCTOR_SELECT)
        .maybeSingle();
      handleSupabaseError(doctorUpdateErr, "No se pudo reactivar el doctor existente.");
      if (doctorRowActualizado) {
        doctorRow = doctorRowActualizado;
      } else {
        const { data: doctorRowRefetch, error: doctorRefetchErr } = await supabase
          .from("doctores")
          .select(DOCTOR_SELECT)
          .eq("id", doctorExistente.id)
          .maybeSingle();
        handleSupabaseError(doctorRefetchErr, "No se pudo obtener la información actualizada del doctor.");
        doctorRow = doctorRowRefetch;
      }
      doctorId = doctorExistente.id;
    } else {
      const { data: doctorRowCreado, error: doctorErr } = await supabase
        .from("doctores")
        .insert([
          {
            persona_id: personaId,
            especialidad_principal: doctor.especialidad_principal,
            sub_especialidad: doctor.sub_especialidad ?? null,
            estado: "activo",
          },
        ])
        .select(DOCTOR_SELECT)
        .maybeSingle();
      handleSupabaseError(doctorErr, "No se pudo crear el registro del doctor.");
      if (doctorRowCreado) {
        doctorRow = doctorRowCreado;
      } else if (doctorId) {
        const { data: doctorRowRefetch, error: doctorRefetchErr } = await supabase
          .from("doctores")
          .select(DOCTOR_SELECT)
          .eq("id", doctorId)
          .maybeSingle();
        handleSupabaseError(doctorRefetchErr, "No se pudo obtener el doctor recién creado.");
        doctorRow = doctorRowRefetch;
      } else {
        const { data: doctorRowRefetch, error: doctorRefetchErr } = await supabase
          .from("doctores")
          .select(DOCTOR_SELECT)
          .eq("persona_id", personaId)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        handleSupabaseError(doctorRefetchErr, "No se pudo obtener el doctor recién creado.");
        doctorRow = doctorRowRefetch;
        doctorId = doctorRowRefetch?.id ?? doctorId;
      }
      doctorId = doctorRowCreado?.id ?? doctorRow?.id ?? doctorId ?? null;
      doctorCreado = true;
    }

    const { data: usuarioExistente, error: usuarioFindErr } = await supabase
      .from("usuarios")
      .select("id, deleted_at, estado, password_hash, rol")
      .eq("persona_id", personaId)
      .maybeSingle();
    handleSupabaseError(usuarioFindErr, "No se pudo validar duplicados de usuario.");

    if (usuarioExistente?.id) {
      usuarioPrev = {
        id: usuarioExistente.id,
        deleted_at: usuarioExistente.deleted_at,
        estado: usuarioExistente.estado,
        password_hash: usuarioExistente.password_hash,
        rol: usuarioExistente.rol,
      };

      const { data: usuarioRowActualizado, error: usuarioUpdateErr } = await supabase
        .from("usuarios")
        .update({
          rol: "doctor",
          estado: "pendiente",
          password_hash: passwordHash,
          deleted_at: null,
        })
        .eq("id", usuarioExistente.id)
        .select("id")
        .maybeSingle();
      handleSupabaseError(usuarioUpdateErr, "No se pudo actualizar el usuario del doctor.");
      usuarioId = usuarioRowActualizado?.id ?? usuarioExistente.id;
    } else {
      const { data: usuarioRowCreado, error: usuarioErr } = await supabase
        .from("usuarios")
        .insert([
          {
            persona_id: personaId,
            rol: "doctor",
            estado: "pendiente",
            password_hash: passwordHash,
            created_at: fechaLocalISO(),
          },
        ])
        .select("id")
        .maybeSingle();
      handleSupabaseError(usuarioErr, "No se pudo crear el usuario del doctor.");
      usuarioId = usuarioRowCreado?.id;
      usuarioCreado = true;
    }

    const { error: eventError } = await supabase.from("event_log").insert([
      {
        actor_uuid: actorUuid,
        evento: "crear_doctor_con_usuario",
        detalle: {
          persona_id: personaId,
          doctor_id: doctorId,
          usuario_id: usuarioId,
          email,
          passwordTemporal: passwordPlain,
        },
        created_at: fechaLocalISO(),
      },
    ]);
    handleSupabaseError(eventError, "No se pudo registrar el evento de creación del doctor.");

    return {
      doctor: mapDoctor(doctorRow),
      persona: { id: personaId },
      usuario: { id: usuarioId, persona_id: personaId, rol: "doctor", estado: "pendiente" },
      passwordTemporal: passwordPlain,
    };
  } catch (error) {
    if (doctorCreado && doctorId) {
      await supabase
        .from("doctores")
        .update({ deleted_at: fechaLocalISO(), estado: "inactivo" })
        .eq("id", doctorId);
    }
    if (!doctorCreado && doctorPrev?.id) {
      await supabase
        .from("doctores")
        .update({
          especialidad_principal: doctorPrev.especialidad_principal,
          sub_especialidad: doctorPrev.sub_especialidad,
          estado: doctorPrev.estado ?? "inactivo",
          deleted_at: doctorPrev.deleted_at ?? null,
        })
        .eq("id", doctorPrev.id);
    }
    if (personaCreada && personaId) {
      await supabase
        .from("personas")
        .update({ deleted_at: fechaLocalISO() })
        .eq("id", personaId);
    }
    if (!personaCreada && personaPrev?.id) {
      await supabase
        .from("personas")
        .update({ deleted_at: personaPrev.deleted_at ?? null })
        .eq("id", personaPrev.id);
    }
    if (usuarioCreado && usuarioId) {
      await supabase
        .from("usuarios")
        .update({ deleted_at: fechaLocalISO(), estado: "inactivo" })
        .eq("id", usuarioId);
    }
    if (!usuarioCreado && usuarioPrev?.id) {
      await supabase
        .from("usuarios")
        .update({
          deleted_at: usuarioPrev.deleted_at ?? null,
          estado: usuarioPrev.estado ?? "inactivo",
          password_hash: usuarioPrev.password_hash ?? null,
          rol: usuarioPrev.rol ?? "doctor",
        })
        .eq("id", usuarioPrev.id);
    }
    throw error;
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
