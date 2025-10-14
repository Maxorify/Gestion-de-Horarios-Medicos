// src/services/doctores.js
import { supabase } from "@/services/supabaseClient";

/** Especialidades principales (sin padre) para el modal de Nuevo Doctor */
export async function listarEspecialidadesPrincipales() {
  const { data, error } = await supabase
    .from("especialidades")
    .select("id, nombre, precio_base")
    .is("especialidad_padre_id", null)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Subespecialidades por principal (para agendar) */
export async function listarSubespecialidades(parentId) {
  const { data, error } = await supabase
    .from("especialidades")
    .select("id, nombre, precio_base, especialidad_padre_id")
    .eq("especialidad_padre_id", parentId)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Árbol principal + subespecialidades (opcional, admin) */
export async function listarEspecialidadesTree() {
  const principales = await listarEspecialidadesPrincipales();
  if (!principales.length) return [];
  const ids = principales.map(p => p.id);

  const { data: subs, error: e2 } = await supabase
    .from("especialidades")
    .select("id, nombre, precio_base, especialidad_padre_id")
    .in("especialidad_padre_id", ids)
    .order("nombre", { ascending: true });

  if (e2) throw e2;

  const byParent = (subs || []).reduce((acc, s) => {
    (acc[s.especialidad_padre_id] ||= []).push(s);
    return acc;
  }, {});
  return principales.map(p => ({ ...p, subespecialidades: byParent[p.id] || [] }));
}

/** Listado de doctores (para la tabla de admin) */
export async function listarDoctores({ search = "", limit = 50, offset = 0 } = {}) {
  const query = supabase
    .from("usuarios")
    .select(`
      id,
      nombre,
      email,
      avatar_url,
      doctores_especialidades (
        especialidades ( nombre )
      )
    `)
    .eq("activo", true)
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (search?.trim()) query.ilike("nombre", `%${search.trim()}%`);

  const { data: rows, error } = await query;
  if (error) throw error;

  return (rows || []).map((d) => ({
    id: d.id,
    nombre: d.nombre,
    email: d.email || "",
    avatar_url: d.avatar_url || null,
    especialidades: (d.doctores_especialidades || [])
      .map((x) => x.especialidades?.nombre)
      .filter(Boolean)
      .join(", "),
  }));
}

/** Crea usuario doctor + vínculos de especialidad. Opcional: avatar (de momento ignorar storage). */
export async function crearDoctor(input) {
  const {
    nombre, email, password,
    telefono = null, direccion = null, bio = null,
    especialidadesIds = [],
    sueldo_base_mensual = 0,
    pago_por_atencion = 0,
    tope_variable_mensual = null,
    avatarFile = null, // ignoramos subir por ahora
  } = input;

  if (!nombre || !email || !password) {
    throw new Error("Faltan campos obligatorios: nombre, email, password");
  }
  if (!Array.isArray(especialidadesIds) || especialidadesIds.length === 0) {
    throw new Error("Selecciona al menos una especialidad principal");
  }

  // 1) Crear usuario
  const { data: user, error: e1 } = await supabase
    .from("usuarios")
    .insert({
      nombre,
      email,
      password,        // en tu BD ya es plain-text; si cifras después, cambia aquí
      rol_id: 2,       // asumiendo 2 = doctor. Si tu tabla 'roles' difiere, ajusta este valor.
      activo: true,
      avatar_url: null
    })
    .select("id")
    .single();

  if (e1) throw e1;

  const doctorId = user.id;

  // 2) Upsert en tabla de sueldos si la tienes (si no, sáltalo)
  // Si no existe tabla aún, comenta este bloque.
  if (typeof sueldo_base_mensual === "number" || typeof pago_por_atencion === "number" || tope_variable_mensual !== undefined) {
    const { error: e2 } = await supabase
      .from("tarifas")
      .upsert({
        doctor_id: doctorId,
        sueldo_base_mensual: Number(sueldo_base_mensual) || 0,
        pago_por_atencion: Number(pago_por_atencion) || 0,
        tope_variable_mensual: tope_variable_mensual === null ? null : Number(tope_variable_mensual)
      }, { onConflict: "doctor_id" });

    if (e2 && e2.code !== "PGRST116") throw e2; // ignora si la tabla no existe
  }

  // 3) Vincular especialidades principales
  if (especialidadesIds.length) {
    const filas = especialidadesIds.map(eid => ({ doctor_id: doctorId, especialidad_id: eid }));
    const { error: e3 } = await supabase.from("doctores_especialidades").insert(filas);
    if (e3) throw e3;
  }

  // 4) (Opcional) subir avatar a storage y actualizar avatar_url
  // De momento omitimos. Si luego definimos el bucket, lo implementamos.

  return doctorId;
}
