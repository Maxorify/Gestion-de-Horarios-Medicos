// src/pages/MisCitas.jsx
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { supabase, isSupabaseConfigured } from "@/services/supabaseClient";

export default function MisCitas() {
  const { user } = useUser();
  const isPatient = user?.rol?.toLowerCase() === "paciente";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Usa el paciente actual; de demo dejamos 13 si no hay nada guardado
  const pacienteId = Number(localStorage.getItem("paciente_id") || 13);

  useEffect(() => {
    if (!isPatient) {
      setErrorMessage("Esta vista solo está disponible para pacientes.");
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage(
        "La conexión con Supabase no está configurada. No es posible cargar las citas."
      );
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { data, error } = await supabase.rpc("rpc_my_appointments", {
          p_paciente_id: pacienteId,
        });

        if (error) {
          setErrorMessage(
            "No fue posible obtener tus citas en este momento. Intenta nuevamente más tarde."
          );
          console.warn("rpc_my_appointments error:", error);
          setRows([]);
          return;
        }

        setRows(data || []);
      } catch (error) {
        console.warn("rpc_my_appointments exception:", error);
        setErrorMessage(
          "Ocurrió un problema al cargar tus citas. Intenta nuevamente más tarde."
        );
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isPatient, pacienteId]);

  const cancelar = async (citaId) => {
    if (!isPatient) {
      alert("Esta acción solo está disponible para pacientes.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      alert("La conexión con Supabase no está configurada");
      return;
    }

    try {
      const { error } = await supabase.rpc("rpc_patient_cancel", {
        p_cita_id: citaId,
      });
      if (error) {
        console.warn("rpc_patient_cancel error:", error);
        alert("No se pudo cancelar la cita");
        return;
      }
    } catch (error) {
      console.warn("rpc_patient_cancel exception:", error);
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
      ) : errorMessage ? (
        <p>{errorMessage}</p>
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
