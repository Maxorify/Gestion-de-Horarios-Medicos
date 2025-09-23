// src/pages/Reservar.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export default function Reservar() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  // Por ahora usamos el paciente 13 (demo) o el que guardes en localStorage
  const pacienteId = Number(localStorage.getItem("paciente_id") || 13);
  const email = localStorage.getItem("userEmail") || "paciente@test.com";

  const loadSlots = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("rpc_slots", {
      p_desde: new Date().toISOString().slice(0, 10),
      p_dias: 7,
      p_doctor_id: null, // o 1 si quieres filtrar por doctor
    });
    if (error) {
      console.error("rpc_slots error:", error);
      setSlots([]);
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const reservar = async (horario_id) => {
    if (!pacienteId) {
      alert("No tengo paciente_id. Usa paciente demo 13 o guarda paciente_id en localStorage.");
      return;
    }
    setBooking(true);
    const { data, error } = await supabase.rpc("rpc_patient_book", {
      p_paciente_id: pacienteId,
      p_horario_id: horario_id,
      p_email: email,
    });
    setBooking(false);
    if (error) {
      console.error("rpc_patient_book error:", error);
      alert(error.message || "No se pudo reservar.");
      return;
    }
    alert(data || "Reserva creada.");
    loadSlots();
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Reservar hora</h1>
      <button onClick={loadSlots} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? "Cargando..." : "Refrescar"}
      </button>

      {loading ? (
        <p>Cargando horarios…</p>
      ) : slots.length === 0 ? (
        <p>No hay horarios libres en la próxima semana.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {slots.map((s) => (
            <div
              key={s.horario_id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{s.fecha}</div>
                <div>
                  {String(s.hora_inicio).slice(0, 5)}–{String(s.hora_fin).slice(0, 5)}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Doctor ID: {s.doctor_id}</div>
              </div>
              <button onClick={() => reservar(s.horario_id)} disabled={booking}>
                {booking ? "Reservando..." : "Reservar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
