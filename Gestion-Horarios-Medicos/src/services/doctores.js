// src/services/doctores.js
import { supabase } from "@/services/supabaseClient";

/** Util: obtiene el id del rol 'doctor' y lo cachea en memoria */
let _ROL_DOCTOR_ID = null;
async function getRolDoctorId() {
  if (_ROL_DOCTOR_ID) return _ROL_DOCTOR_ID;
  const { data, error } = await supabase
    .from("roles")
    .select("id")
    .eq("nombre", "doctor")
    .single();
  if (error) throw error;
  _ROL_DOCTOR_ID = data?.id;
  return _ROL_DOCTOR_ID;
}

/** Especialidades para el select múltiple */
export async function listarEspecialidades() {
  const { data, error } = await supabase
    .from("especialidades")
    .select("id, nombre")
  .order("nombre", { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Subida de avatar a bucket 'avatars' con ruta do/onctorId.jpg */
export async function subirAvatarDoctor(doctorId, file) {
  if (!file) return null;
  const filePath = `doctores/${doctorId}.jpg`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return pub?.publicUrl || null;
}

/**
 * Lista doctores con filtro por nombre y paginación.
 * Importante: usamos range(offset, offset+limit-1). No mezclar con .limit().
 */
export async function listarDoctores({ search = "", limit = 50, offset = 0 } = {}) {
  const rolDoctorId = await getRolDoctorId();

  // Si tu FK está bien, este join funciona tal cual:
  // usuarios.rol_id -> roles.id, y doctores_especialidades.doctor_id -> usuarios.id
  const { data: rows, error } = await supabase
    .from("usuarios")
    .select(`
      id,
      nombre,
      email,
      avatar_url,
      rol_id,
      doctores_especialidades (
        especialidades ( nombre )
      )
    `)
    .eq("activo", true)
    .eq("rol_id", rolDoctorId)
    .ilike("nombre", `%${search}%`)
    .range(offset, Math.max(offset, 0) + Math.max(limit, 1) - 1);

  if (error) throw error;

  return (rows || []).map((d) => ({
    id: d.id,
    nombre: d.nombre,
    email: d.email || "",
    avatar_url: d.avatar_url || null,
    especialidades: (d.doctores_especialidades || [])
      .map((x) => x?.especialidades?.nombre)
      .filter(Boolean)
      .join(", "),
  }));
}

/**
 * Crea doctor + perfil + especialidades + avatar.
 * Requiere:
 *  - usuarios.password NOT NULL (tu schema lo exige)
 *  - rol 'doctor' existente en tabla roles
 *  - bucket 'avatars' (público o con policy de lectura)
 */
export async function crearDoctor({
  nombre,
  email,
  password, // sí, tu tabla lo exige. En producción, hashea. Aquí no me vengas con plaintext eterno.
  telefono,
  direccion,
  bio,
  sueldo_base_mensual = 0,
  pago_por_atencion = 0,
  tope_variable_mensual = null,
  especialidadesIds = [],
  avatarFile, // File
}) {
  const rolDoctorId = await getRolDoctorId();

  // 1) usuario
  const { data: usuario, error: uErr } = await supabase
    .from("usuarios")
    .insert({
      nombre,
      email,
      password,         // si ya tienes flujo de hash, aplica antes de enviar
      rol_id: rolDoctorId,
      activo: true,
    })
    .select("id")
    .single();
  if (uErr) throw uErr;

  const doctorId = usuario.id;

  // 2) avatar opcional
  let avatarUrl = null;
  if (avatarFile) {
    avatarUrl = await subirAvatarDoctor(doctorId, avatarFile);
    const { error: upUser } = await supabase
      .from("usuarios")
      .update({ avatar_url: avatarUrl })
      .eq("id", doctorId);
    if (upUser) throw upUser;
  }

  // 3) perfil (tabla doctor_perfil)
  const { error: pErr } = await supabase.from("doctor_perfil").upsert({
    doctor_id: doctorId,
    telefono: telefono || null,
    direccion: direccion || null,
    bio: bio || null,
    sueldo_base_mensual: Number(sueldo_base_mensual) || 0,
    pago_por_atencion: Number(pago_por_atencion) || 0,
    tope_variable_mensual:
      tope_variable_mensual != null ? Number(tope_variable_mensual) : null,
    actualizado_en: new Date().toISOString(),
  });
  if (pErr) throw pErr;

  // 4) especialidades
  // limpiamos y reinsertamos para mantenerlo simple
  const { error: delErr } = await supabase
    .from("doctores_especialidades")
    .delete()
    .eq("doctor_id", doctorId);
  if (delErr) throw delErr;

  if (especialidadesIds.length) {
    const rows = especialidadesIds.map((eid) => ({
      doctor_id: doctorId,
      especialidad_id: eid,
    }));
    const { error: insErr } = await supabase
      .from("doctores_especialidades")
      .insert(rows);
    if (insErr) throw insErr;
  }

  return { doctorId, avatarUrl };
}
