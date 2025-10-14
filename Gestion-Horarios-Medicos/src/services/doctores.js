import { supabase } from "@/services/supabaseClient";

export async function listarDoctores({ search = "", limit = 50, offset = 0 } = {}) {
  const { data: rows, error } = await supabase
    .from("usuarios")
    .select(
      `
      id,
      nombre,
      email,
      avatar_url,
      doctores_especialidades (
        especialidades ( nombre )
      )
    `
    )
    .eq("activo", true)
    .ilike("nombre", `%${search}%`)
    .limit(limit)
    .range(offset, offset + limit - 1);

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

