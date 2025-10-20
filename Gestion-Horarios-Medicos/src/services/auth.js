import { supabase } from "./supabaseClient";

async function obtenerDoctorPorPersonaId(personaId) {
  if (!personaId) return null;

  const { data, error } = await supabase
    .from("doctores")
    .select("id, persona_id, especialidad_principal, estado")
    .eq("persona_id", personaId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

async function obtenerPacientePorPersonaId(personaId) {
  if (!personaId) return null;

  const { data, error } = await supabase
    .from("pacientes")
    .select("id, persona_id")
    .eq("persona_id", personaId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function obtenerPerfilUsuarioPorEmail(email) {
  if (!email) {
    throw new Error("El correo electrónico es obligatorio para recuperar el perfil");
  }

  const {
    data: usuario,
    error: usuarioError,
  } = await supabase
    .from("usuarios")
    .select(
      "id, persona_id, rol, estado, personas:persona_id (id, nombre, apellido_paterno, apellido_materno, rut, email, telefono_principal, telefono_secundario)"
    )
    .eq("personas.email", email)
    .eq("estado", "activo")
    .is("deleted_at", null)
    .is("personas.deleted_at", null)
    .maybeSingle();

  if (usuarioError) {
    console.error("// CODEx: Error consultando usuarios/personas por email", usuarioError);
    throw new Error("No se pudo recuperar la información del usuario");
  }

  if (!usuario) {
    throw new Error("No existe un usuario asociado al correo indicado");
  }

  if (usuario.estado && usuario.estado !== "activo") {
    throw new Error("Usuario inactivo o suspendido");
  }

  const personaId = usuario.persona_id ?? usuario.personas?.id ?? null;

  try {
    const [doctor, paciente] = await Promise.all([
      obtenerDoctorPorPersonaId(personaId),
      obtenerPacientePorPersonaId(personaId),
    ]);

    return { ...usuario, doctor, paciente };
  } catch (error) {
    console.error("// CODEx: Error obteniendo doctor/paciente asociados", error);
    throw new Error("No se pudo recuperar los perfiles asociados al usuario");
  }
}

/**
 * Inicia sesión en Supabase y retorna el perfil completo del usuario.
 *
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {Promise<object>} Perfil del usuario con la información anidada de personas.
 * @throws {Error} Si las credenciales son inválidas, el usuario no existe o está inactivo.
 */
export async function loginConEmailYPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.user) {
    throw new Error("Credenciales inválidas");
  }

  const authEmail = data.user.email ?? email;

  try {
    return await obtenerPerfilUsuarioPorEmail(authEmail);
  } catch (profileError) {
    await supabase.auth.signOut();
    throw profileError instanceof Error
      ? profileError
      : new Error("No se pudo obtener el perfil de usuario");
  }
}
