import bcrypt from "bcryptjs";
import { supabase } from "@/services/supabaseClient";

const SALT_ROUNDS = 10;

export async function crearUsuarioDelSistema({
  personaId,
  email,
  rol,
  estado = "pendiente",
  passwordPlain,
}) {
  if (!personaId) {
    throw new Error("El identificador de la persona es obligatorio");
  }
  if (!passwordPlain) {
    throw new Error("La contraseña inicial es obligatoria");
  }
  if (!rol) {
    throw new Error("El rol del usuario es obligatorio");
  }

  const password_hash = await bcrypt.hash(passwordPlain, SALT_ROUNDS);

  const insertPayload = {
    persona_id: personaId,
    password_hash,
    rol,
    estado,
    last_login_at: null,
    deleted_at: null,
  };

  const { data, error } = await supabase
    .from("usuarios")
    .insert([insertPayload])
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("No se pudo crear el usuario del sistema", error);
    throw new Error("No se pudo crear el usuario del sistema");
  }

  return data?.id ?? null;
}

export async function activarUsuario(usuarioId) {
  if (!usuarioId) {
    throw new Error("El identificador del usuario es obligatorio");
  }
  const { error } = await supabase
    .from("usuarios")
    .update({ estado: "activo" })
    .eq("id", usuarioId);
  if (error) {
    console.error("No se pudo activar el usuario", error);
    throw new Error("No se pudo activar el usuario");
  }
}
