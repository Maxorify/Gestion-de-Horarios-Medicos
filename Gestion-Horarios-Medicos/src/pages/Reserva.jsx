import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export default function Reservar() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);

  const loadMe = async () => {
    const { data, error } = await supabase.rpc("rpc_me");
    if (!error) setMe(data?.[0] || null);
  };

  const loadSlots = async () => {
    const { data, error } = await supabase.rpc("rpc_slots", {
      p_desde: new Date().toISOString().slice(0, 10),
      p_dias: 7,
      p_doctor_id: null,
    });
    if (!error) setSlots(data || []);
  };

  useEffect(() => {
    loadMe();
    loadSlots();
  }, []);

  const reservar = async (horario_id) => {
    if (!me?.paciente_id) return alert("No tengo tu paciente_id (rpc_me).");
    setLoading(true);
    const { data, error } = await supabase.rpc("rpc_patient_book", {
      p_paciente_id: me.paciente_id,
      p_horario_id: horario_id,
      p_email: me.email,
    });
    setLoading(false);
    if (error) return alert(error.message);
    alert(data || "OK");
    loadSlots();
  };

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-semibold">Reservar hora</h1>
      <button
        className="border px-3 py-1 rounded"
        onClick={loadSlots}
        disabled={loading}
      >
        Refrescar
      </button>
      <div className="grid gap-2">
        {slots.length === 0 && (
          <div>No hay horarios libres en la próxima semana.</div>
        )}
        {slots.map((s) => (
          <div
            key={s.horario_id}
            className="border rounded p-3 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{s.fecha}</div>
              <div>
                {s.hora_inicio}–{s.hora_fin}
              </div>
            </div>
            <button
              className="bg-black text-white px-3 py-1 rounded disabled:opacity-50"
              onClick={() => reservar(s.horario_id)}
              disabled={loading}
            >
              Reservar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
