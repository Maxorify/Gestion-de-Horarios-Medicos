import { Link } from "react-router-dom";

export default function SecretariaPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Panel de Secretaría</h2>
      <p>
        Accede a las herramientas principales para gestionar citas y asistir a
        los doctores.
      </p>
      <div>
        <Link
          to="/sec/asistencias"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Marcar asistencia por RUT
        </Link>
      </div>
    </div>
  );
}
