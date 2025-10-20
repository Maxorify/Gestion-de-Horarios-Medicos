export function humanizeError(err) {
  const msg = String(err?.message || "");
  const code = err?.code;

  if (code === "BLOQUE_CON_CITAS_ACTIVAS" || msg.includes("DISPONIBILIDAD_TIENE_CITAS_ACTIVAS")) {
    return "No puedes eliminar este bloque porque tiene citas activas. Reprograma o cancela esas citas primero.";
  }
  if (code === "CITA_ACTIVA" || msg.includes("ux_citas_unica_por_paciente_activa")) {
    return "El paciente ya tiene una cita activa.";
  }
  if (msg.toLowerCase().includes("overlap") || msg.toLowerCase().includes("solapa")) {
    return "Ese horario se solapa con otro bloque.";
  }
  return "Ocurrió un error. Intenta nuevamente.";
}
