import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { supabase } from "@/services/supabaseClient";
import { marcarAsistencia } from "@/services/asistencias";
import { cleanRutValue, formatRut, isValidRut } from "@/utils/rut";

function formatearHora(hora) {
  if (!hora) return "";
  return hora.slice(0, 5);
}

export default function MarcarAsistencia() {
  const [rut, setRut] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setResultado(null);

    const rutLimpio = cleanRutValue(rut);
    if (!isValidRut(rutLimpio)) {
      setResultado({
        tipo: "error",
        mensaje: "Ingresa un RUT válido",
      });
      return;
    }

    setLoading(true);
    try {
      const {
        data: persona,
        error: personaError,
      } = await supabase
        .from("personas")
        .select(
          "id, nombre, apellido_paterno, apellido_materno, rut"
        )
        .eq("rut", rutLimpio)
        .is("deleted_at", null)
        .maybeSingle();

      if (personaError) {
        throw personaError;
      }
      if (!persona) {
        setResultado({
          tipo: "error",
          mensaje: "No se encontró una persona con el RUT indicado",
        });
        return;
      }

      const {
        data: doctor,
        error: doctorError,
      } = await supabase
        .from("doctores")
        .select("id, estado")
        .eq("persona_id", persona.id)
        .neq("estado", "inactivo")
        .is("deleted_at", null)
        .maybeSingle();

      if (doctorError) {
        throw doctorError;
      }
      if (!doctor) {
        setResultado({
          tipo: "error",
          mensaje: "El RUT indicado no corresponde a un doctor activo",
        });
        return;
      }

      const asistencia = await marcarAsistencia(doctor.id);
      const yaMarcada = asistencia?.repetida;
      const hora = formatearHora(asistencia?.hora_llegada);
      const horaTexto = hora ? `${hora}` : null;

      setResultado({
        tipo: yaMarcada ? "info" : "success",
        mensaje: yaMarcada
          ? horaTexto
            ? `Ya marcada a ${horaTexto} hrs`
            : "Ya marcada previamente"
          : horaTexto
          ? `Asistencia registrada: ${horaTexto} (Chile)`
          : "Asistencia registrada (Chile)",
        persona,
      });
      setRut("");
    } catch (error) {
      console.error("Error al marcar asistencia", error);
      setResultado({
        tipo: "error",
        mensaje:
          error instanceof Error && error.message
            ? error.message
            : "No se pudo registrar la asistencia",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={480} margin="0 auto" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Marcar asistencia por RUT
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Ingresa el RUT del doctor para registrar su asistencia diaria.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="RUT del doctor"
              value={rut}
              onChange={(event) => setRut(formatRut(event.target.value))}
              placeholder="12.345.678-9"
              fullWidth
              disabled={loading}
              autoComplete="off"
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? "Marcando..." : "Registrar asistencia"}
            </Button>
          </Stack>
        </Box>

        {resultado && (
          <Alert
            severity={resultado.tipo === "error" ? "error" : resultado.tipo}
            sx={{ mt: 3 }}
          >
            <Typography variant="body2">{resultado.mensaje}</Typography>
            {resultado.persona && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {resultado.persona.nombre} {resultado.persona.apellido_paterno} {resultado.persona.apellido_materno}
              </Typography>
            )}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
