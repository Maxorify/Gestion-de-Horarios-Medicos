// src/pages/MisCitas.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export default function MisCitas() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Usa el paciente actual; de demo dejamos 13 si no hay nada guardado
  const pacienteId = Number(localStorage.getItem("paciente_id") || 13);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc("rpc_my_appointments", {
        p_paciente_id: pacienteId,
      });
      if (error) {
        console.error("rpc_my_appointments error:", error);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    };
    load();
  }, [pacienteId]);

  const cancelar = async (citaId) => {
    const { error } = await supabase.rpc("rpc_patient_cancel", {
      p_cita_id: citaId,
    });
    if (error) {
      console.error("rpc_patient_cancel error:", error);
      alert("No se pudo cancelar la cita");
      return;
    }
    // Refresca localmente el estado
    setRows((prev) =>
      prev.map((r) => (r.cita_id === citaId ? { ...r, estado: "cancelada" } : r))
    );
  };

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-semibold">Mis citas</h1>

      {loading ? (
        <p>Cargando…</p>
      ) : rows.length === 0 ? (
        <p>No tienes citas.</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <div
              key={r.cita_id}
              className="border rounded p-3 flex items-center justify-between"
            >
              <div>
                <div>
                  {r.fecha} — {String(r.hora_inicio).slice(0, 5)}–{String(r.hora_fin).slice(0, 5)}
                </div>
                <div className="text-sm text-gray-500">Estado: {r.estado}</div>
              </div>

              {r.estado !== "cancelada" && r.estado !== "moved" && (
                <button
                  onClick={() => cancelar(r.cita_id)}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                >
                  Cancelar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
