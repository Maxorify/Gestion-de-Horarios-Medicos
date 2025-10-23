import { useState } from "react";
import { Link } from "react-router-dom";

import { confirmarCitaSimple } from "@/services/citas";
import { useUser } from "@/hooks/useUser";

const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "transferencia", label: "Transferencia" },
];

export default function SecretariaPanel() {
  const { user } = useUser();
  const [citaId, setCitaId] = useState("");
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("");
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleConfirmarPago = async (event) => {
    event.preventDefault();
    setFeedback(null);

    const citaIdNumber = Number.parseInt(citaId, 10);
    if (!Number.isFinite(citaIdNumber) || citaIdNumber <= 0) {
      setFeedback({ type: "error", message: "Ingresa un ID de cita válido." });
      return;
    }

    if (!user?.usuario_id_legacy) {
      setFeedback({ type: "error", message: "No se encontró el identificador del usuario actual." });
      return;
    }

    setLoading(true);
    try {
      const montoNumber = Number.parseInt(monto, 10);
      await confirmarCitaSimple({
        citaId: citaIdNumber,
        usuarioIdLegacy: user.usuario_id_legacy,
        monto: Number.isFinite(montoNumber) ? montoNumber : 0,
        metodo: metodo || null,
        obs: obs?.trim() ? obs.trim() : null,
      });

      setFeedback({ type: "success", message: "Confirmada" });
    } catch (error) {
      const message = error?.message || "No se pudo confirmar la cita.";
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <form
        onSubmit={handleConfirmarPago}
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4"
      >
        <div>
          <h3 className="text-lg font-semibold">Confirmar pago de cita</h3>
          <p className="text-sm text-gray-600">
            Para la demo, ingresa el ID de la cita y confirma el pago registrado.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">ID de la cita</span>
            <input
              type="number"
              min="1"
              value={citaId}
              onChange={(event) => setCitaId(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: 12345"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Monto</span>
            <input
              type="number"
              min="0"
              step="1"
              value={monto}
              onChange={(event) => setMonto(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Método de pago</span>
            <select
              value={metodo}
              onChange={(event) => setMetodo(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Sin especificar</option>
              {METODOS_PAGO.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium">Observaciones (opcional)</span>
            <textarea
              value={obs}
              onChange={(event) => setObs(event.target.value)}
              rows={3}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Notas internas"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Confirmando..." : "Confirmar pago"}
          </button>
          {feedback && (
            <span
              className={
                feedback.type === "success"
                  ? "text-sm font-medium text-green-600"
                  : "text-sm font-medium text-red-600"
              }
            >
              {feedback.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
