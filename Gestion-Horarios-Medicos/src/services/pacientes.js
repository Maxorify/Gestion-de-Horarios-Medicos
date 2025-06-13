import { supabase } from "./supabaseClient";
export async function guardarPaciente(paciente) {
  const { data, error } = await supabase
    .from("pacientes")
    .insert([paciente])
    .select();

  return { data, error };
}