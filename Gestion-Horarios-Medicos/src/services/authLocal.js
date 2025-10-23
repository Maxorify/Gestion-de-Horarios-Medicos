import bcrypt from "bcryptjs";
import { supabase } from "@/services/supabaseClient";
import { fechaLocalISO } from "@/utils/fechaLocal";

const SESSION_KEY = "app.session";
const SALT_ROUNDS = 10;

function getStorage() {
  if (typeof window === "undefined" || !window?.localStorage) {
    return null;
  }
  return window.localStorage;
}

function persistSession(payload) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("No se pudo guardar la sesión local", error);
  }
}

function removeSession() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn("No se pudo eliminar la sesión local", error);
  }
}

function normalizeEmail(email) {
  return (email ?? "").trim().toLowerCase();
}

export function getSession() {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.usuario_id &&
      parsed.persona_id &&
      parsed.rol &&
      parsed.email
    ) {
      return parsed;
    }
  } catch (error) {
    console.warn("No se pudo leer la sesión local", error);
  }
  removeSession();
  return null;
}

export async function login(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const plainPassword = password ?? "";
  if (!normalizedEmail || !plainPassword) {
    throw new Error("El correo y la contraseña son obligatorios");
  }

  const {
    data: persona,
    error: personaError,
  } = await supabase
    .from("personas")
    .select("id, email")
    .eq("email", normalizedEmail)
    .is("deleted_at", null)
    .maybeSingle();

  if (personaError) {
    console.error("Error consultando persona por email", personaError);
    throw new Error("No se pudo verificar las credenciales");
  }

  if (!persona?.id) {
    throw new Error("Credenciales inválidas o usuario inactivo");
  }

  const personaId = persona.id;

  const {
    data: usuario,
    error: usuarioError,
  } = await supabase
    .from("usuarios")
    .select("id, id_legacy, password_hash, rol, estado, persona_id")
    .eq("persona_id", personaId)
    .is("deleted_at", null)
    .maybeSingle();

  if (usuarioError) {
    console.error("Error consultando usuario por persona", usuarioError);
    throw new Error("No se pudo verificar las credenciales");
  }

  if (!usuario?.password_hash) {
    throw new Error("Credenciales inválidas o usuario inactivo");
  }

  const passwordMatches = await bcrypt.compare(plainPassword, usuario.password_hash);
  if (!passwordMatches) {
    throw new Error("Credenciales inválidas o usuario inactivo");
  }

  const usuarioIdLegacy = usuario?.id_legacy ?? null;

  if (usuario.estado === "pendiente") {
    return {
      pending: true,
      usuario_id: usuario.id,
      usuario_id_legacy: usuarioIdLegacy,
      persona_id: personaId,
      rol: usuario.rol,
      email: normalizedEmail,
    };
  }

  if (usuario.estado !== "activo") {
    throw new Error("Credenciales inválidas o usuario inactivo");
  }

  const payload = {
    // Mantener ambos identificadores para compatibilidad con RPCs legacy.
    usuario_id: usuario.id,
    usuario_id_legacy: usuarioIdLegacy,
    persona_id: personaId,
    rol: usuario.rol,
    email: normalizedEmail,
  };

  persistSession(payload);

  const timestamp = fechaLocalISO();
  const { error: updateError } = await supabase
    .from("usuarios")
    .update({ last_login_at: timestamp })
    .eq("id", usuario.id);

  if (updateError) {
    console.warn("No se pudo actualizar la fecha de último acceso", updateError);
  }

  return payload;
}

export function logout() {
  removeSession();
}

export async function activarContrasenaInicial(usuarioId, nuevaPassword) {
  if (!usuarioId) {
    throw new Error("El identificador del usuario es obligatorio");
  }
  if (!minPasswordOk(nuevaPassword)) {
    throw new Error("La contraseña no cumple con los requisitos mínimos");
  }

  const password_hash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
  const { error } = await supabase
    .from("usuarios")
    .update({ password_hash, estado: "activo", updated_at: fechaLocalISO() })
    .eq("id", usuarioId);

  if (error) {
    console.error("No se pudo activar la contraseña inicial", error);
    throw new Error("No se pudo actualizar la contraseña");
  }
}

export function minPasswordOk(password) {
  return typeof password === "string" && password.length >= 8;
}

export function requireRole(...roles) {
  if (!roles || roles.length === 0) {
    return Boolean(getSession());
  }
  const allowed = roles.map((role) => (role ?? "").toLowerCase());
  const session = getSession();
  if (!session) return false;
  return allowed.includes((session.rol ?? "").toLowerCase());
}

export async function cambiarPassword(usuarioId, newPlainPassword) {
  if (!usuarioId) {
    throw new Error("El identificador del usuario es obligatorio");
  }
  if (!newPlainPassword) {
    throw new Error("La nueva contraseña es obligatoria");
  }
  const password_hash = await bcrypt.hash(newPlainPassword, SALT_ROUNDS);
  const { error } = await supabase
    .from("usuarios")
    .update({ password_hash })
    .eq("id", usuarioId);
  if (error) {
    console.error("No se pudo actualizar la contraseña", error);
    throw new Error("No se pudo actualizar la contraseña");
  }
}
