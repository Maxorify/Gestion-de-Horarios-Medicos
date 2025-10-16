import { supabase } from "./supabaseClient";

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

  if (error || !data?.user?.id) {
    throw new Error("Credenciales inválidas");
  }

  const userId = data.user.id;

  const {
    data: usuario,
    error: usuarioError,
  } = await supabase
    .from("usuarios")
    .select("*, personas(*)")
    .eq("id", userId)
    .single();

  if (usuarioError || !usuario) {
    throw new Error("No se pudo obtener el perfil de usuario");
  }

  if (usuario.estado !== "activo") {
    await supabase.auth.signOut();
    throw new Error("Usuario inactivo o suspendido");
  }

  return usuario;
}
