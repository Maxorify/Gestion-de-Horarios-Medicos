import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export default function MisCitas() {
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);

  const loadMe = async () => {
    const { data } = await supabase.rpc("rpc_me");
    setMe(data?.[0] || null);
  };

  const load = async (paciente_id) => {
    const { data, error } = await supabase.rpc("rpc_my_appointments", {
      p_paciente_id: paciente_id,
    });
    if (!error) setItems(data || []);
  };

  useEffect(() => {
    (async () => {
      await loadMe();
    })();
  }, []);

  useEffect(() => {
    if (me?.paciente_id) load(me.paciente_id);
  }, [me]);

  const cancelar = async (cita_id) => {
    const { data, error } = await supabase.rpc("rpc_patient_cancel", {
      p_cita_id: cita_id,
      p_reason: "cancelada por paciente",
    });
    if (error) return alert(error.message);
    alert(data || "OK");
    load(me.paciente_id);
  };

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-semibold">Mis citas</h1>
      <div className="grid gap-2">
        {items.length === 0 && <div>No tienes citas.</div>}
        {items.map((c) => (
          <div
            key={c.cita_id}
            className="border rounded p-3 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">
                {c.fecha} {c.hora_inicio}–{c.hora_fin}
              </div>
              <div className="text-sm opacity-70">Estado: {c.estado}</div>
            </div>
            {c.estado !== "cancelada" && (
              <button
                className="border px-3 py-1 rounded"
                onClick={() => cancelar(c.cita_id)}
              >
                Cancelar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
