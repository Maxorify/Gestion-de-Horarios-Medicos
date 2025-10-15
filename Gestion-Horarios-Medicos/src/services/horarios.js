import { supabase } from "@/services/supabaseClient";

export async function listarTurnosDoctor(doctorId) {
  const { data, error } = await supabase
    .from("doctores_turnos")
    .select("id, weekday, hora_inicio, hora_fin, slot_minutos, activo")
    .eq("doctor_id", doctorId)
    .order("weekday", { ascending: true })
    .order("hora_inicio", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertTurnoDoctor({
  id,
  doctor_id,
  weekday,
  hora_inicio,
  hora_fin,
  slot_minutos,
  activo = true,
}) {
  const payload = { doctor_id, weekday, hora_inicio, hora_fin, slot_minutos, activo };
  if (id) payload.id = id;
  const { data, error } = await supabase
    .from("doctores_turnos")
    .upsert(payload, { onConflict: "doctor_id,weekday,hora_inicio,hora_fin" })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function eliminarTurnoDoctor(id) {
  const { error } = await supabase.from("doctores_turnos").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function generarHorarios({ doctor_id, desde, hasta, overwrite = false }) {
  const { data, error } = await supabase
    .rpc("rpc_generar_horarios", {
      p_doctor_id: doctor_id,
      p_desde: desde,
      p_hasta: hasta,
      p_overwrite: overwrite,
    });
  if (error) throw error;
  return data;
}

export async function listarSlotsProximos(doctorId, limit = 50) {
  const { data, error } = await supabase
    .from("horarios_disponibles")
    .select("id, fecha, hora_inicio, hora_fin, status, paciente_id")
    .eq("doctor_id", doctorId)
    .gte("fecha", new Date().toISOString().slice(0, 10))
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

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
