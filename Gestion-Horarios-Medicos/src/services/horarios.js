import { supabase } from "@/services/supabaseClient";

export async function listarSlotsDoctor({ doctorId, desde, dias = 14 }) {
  const { data, error } = await supabase.rpc("rpc_slots", {
    p_desde: desde,
    p_dias: dias,
    p_doctor_id: doctorId,
  });

  if (error) throw error;

  return (data || []).map((s) => ({
    id: s.id,
    doctor_id: s.doctor_id,
    fecha: s.fecha,
    hora_inicio: s.hora_inicio,
    hora_fin: s.hora_fin,
  }));
}

export async function reservarSlot({ pacienteId, horarioId, email }) {
  const { data, error } = await supabase.rpc("rpc_patient_book", {
    p_paciente_id: pacienteId,
    p_horario_id: horarioId,
    p_email: email,
  });

  if (error) throw error;

  return data;
}

