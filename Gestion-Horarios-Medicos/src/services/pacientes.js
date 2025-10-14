import { supabase } from "@/services/supabaseClient";

// Inserta y lanza error si falla
export async function guardarPaciente(paciente) {
  const { data, error } = await supabase
    .from("pacientes")
    .insert(paciente)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Trae y mapea a la forma de la tabla UI
export async function listarPacientes() {
  const { data, error } = await supabase
    .from("pacientes")
    .select("id, nombres_apellidos, rut, email, telefono, creado_en")
    .order("creado_en", { ascending: false, nullsFirst: false });

  if (error) throw error;

  return (data || []).map((p) => {
    const full = (p.nombres_apellidos || "").trim();
    const [first, ...rest] = full.split(/\s+/);
    return {
      id: p.id,
      rut: p.rut || "",
      nombre: first || "",
      apellido: rest.join(" ") || "",
      correo: p.email || "",
      numero: p.telefono || "",
    };
  });
}
