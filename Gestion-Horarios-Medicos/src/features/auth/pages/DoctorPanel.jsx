import { useEffect, useState } from "react";
import dayjs from "dayjs";

import { useUser } from "@/hooks/useUser";
import { listarCitasDoctorConfirmadas } from "@/services/citas";

export default function DoctorPanel() {
  const { user } = useUser();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;

    const cargarCitas = async () => {
      if (!user?.doctor_id) {
        setCitas([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const desde = dayjs().subtract(1, "day").toISOString();
        const hasta = dayjs().add(7, "day").toISOString();
        const rows = await listarCitasDoctorConfirmadas({
          doctorId: user.doctor_id,
          desdeISO: desde,
          hastaISO: hasta,
        });

        if (!cancel) {
          setCitas(rows);
        }
      } catch (err) {
        if (!cancel) {
          setError(err?.message ?? "No se pudieron cargar las citas confirmadas.");
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    };

    cargarCitas();

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
