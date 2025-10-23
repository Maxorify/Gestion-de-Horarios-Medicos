import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useUser } from "@/hooks/useUser";
import { listarCitasDoctorConfirmadas } from "@/services/citas";

function DoctorDashboardContent() {
  const { user } = useUser();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;

    (async () => {
      if (!user?.doctor_id) {
        if (!cancel) {
          setCitas([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      const desdeISO = new Date("2000-01-01T00:00:00.000Z").toISOString();
      const hastaISO = new Date("2100-01-01T00:00:00.000Z").toISOString();

      try {
        const data = await listarCitasDoctorConfirmadas({
          doctorId: user.doctor_id,
          desdeISO,
          hastaISO,
        });

        if (!cancel) {
          const rows = (Array.isArray(data) ? data : []).map((row) => ({
            ...row,
            cita_id: row.cita_id ?? row.id ?? row.citaId ?? row.citaID ?? null,
            paciente_nombre:
              row.paciente_nombre ??
              row.nombre_paciente ??
              row.pacienteNombre ??
              row.nombre ??
              "Paciente sin nombre",
            fecha_hora_inicio_agendada:
              row.fecha_hora_inicio_agendada ??
              row.fecha_inicio ??
              row.inicio ??
              row.fechaHoraInicio ??
              null,
            fecha_hora_fin_agendada:
              row.fecha_hora_fin_agendada ??
              row.fecha_fin ??
              row.fin ??
              row.fechaHoraFin ??
              null,
            paciente_rut: row.paciente_rut ?? row.rut ?? row.pacienteRut ?? null,
          }));
          setCitas(rows);
        }
      } catch (e) {
        if (!cancel) {
          console.error("Error listando confirmadas:", e);
          setError(e?.message ?? "No se pudieron cargar las citas confirmadas.");
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [user?.doctor_id]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Citas confirmadas</h2>
      {loading && <p className="text-sm text-gray-600">Cargando citas...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <ul className="space-y-2">
          {citas.length === 0 ? (
            <li className="text-sm text-gray-600">No hay citas confirmadas en el rango seleccionado.</li>
          ) : (
            citas.map((cita) => (
              <li key={cita.cita_id} className="rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="font-medium text-gray-900">{cita.paciente_nombre || "Paciente sin nombre"}</p>
                <p className="text-sm text-gray-600">
                  {dayjs(cita.fecha_hora_inicio_agendada).format("DD/MM/YYYY HH:mm")} - {" "}
                  {dayjs(cita.fecha_hora_fin_agendada).format("HH:mm")}
                </p>
                {cita.paciente_rut && <p className="text-sm text-gray-500">RUT: {cita.paciente_rut}</p>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function DoctorPanel() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
          <Topbar />
        </div>
        <main className="p-4 flex-1 overflow-auto space-y-6">
          <DoctorDashboardContent />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
