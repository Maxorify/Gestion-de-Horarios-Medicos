import { useState } from "react";
import { Link } from "react-router-dom";

import { Box, Button, MenuItem, TextField, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { confirmarCitaSimple } from "@/services/citas";
import { useUser } from "@/hooks/useUser";
import { tokens } from "@/theme";

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
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";
  const surface = isDark ? colors.primary[600] : colors.primary[100];
  const borderColor = isDark ? colors.primary[700] : colors.grey[300];
  const textPrimary = isDark ? colors.grey[100] : colors.grey[900];
  const textSecondary = isDark ? colors.grey[300] : colors.grey[600];
  const shadow = isDark
    ? `0 18px 45px ${alpha(colors.primary[900], 0.55)}`
    : `0 16px 32px ${alpha(colors.grey[900], 0.1)}`;
  const focusBorder = isDark ? colors.blueAccent[500] : colors.blueAccent[600];

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h4" sx={{ color: textPrimary }}>
          Panel de Secretaría
        </Typography>
        <Typography variant="body1" sx={{ color: textSecondary }}>
          Accede a las herramientas principales para gestionar citas y asistir a los doctores.
        </Typography>
        <Button
          component={Link}
          to="/secretaria/check-in"
          variant="contained"
          sx={{
            alignSelf: { xs: "stretch", sm: "flex-start" },
            backgroundColor: colors.blueAccent[600],
            "&:hover": {
              backgroundColor: colors.blueAccent[500],
            },
          }}
        >
          Marcar asistencia por RUT
        </Button>
      </Box>

      <Box
        component="form"
        onSubmit={handleConfirmarPago}
        sx={{
          backgroundColor: surface,
          border: `1px solid ${borderColor}`,
          borderRadius: 3,
          p: { xs: 3, md: 4 },
          display: "flex",
          flexDirection: "column",
          gap: 3,
          boxShadow: shadow,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: textPrimary, mb: 0.5 }}>
            Confirmar pago de cita
          </Typography>
          <Typography variant="body2" sx={{ color: textSecondary }}>
            Para la demo, ingresa el ID de la cita y confirma el pago registrado.
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <TextField
            label="ID de la cita"
            type="number"
            required
            value={citaId}
            onChange={(event) => setCitaId(event.target.value)}
            inputProps={{ min: 1 }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor },
                "&:hover fieldset": { borderColor: focusBorder },
                "&.Mui-focused fieldset": { borderColor: focusBorder },
              },
            }}
          />
          <TextField
            label="Monto"
            type="number"
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            inputProps={{ min: 0, step: 1 }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor },
                "&:hover fieldset": { borderColor: focusBorder },
                "&.Mui-focused fieldset": { borderColor: focusBorder },
              },
            }}
          />
          <TextField
            label="Método de pago"
            select
            value={metodo}
            onChange={(event) => setMetodo(event.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor },
                "&:hover fieldset": { borderColor: focusBorder },
                "&.Mui-focused fieldset": { borderColor: focusBorder },
              },
            }}
          >
            <MenuItem value="">Sin especificar</MenuItem>
            {METODOS_PAGO.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Observaciones (opcional)"
            multiline
            rows={3}
            value={obs}
            onChange={(event) => setObs(event.target.value)}
            sx={{
              gridColumn: { md: "1 / -1" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor },
                "&:hover fieldset": { borderColor: focusBorder },
                "&.Mui-focused fieldset": { borderColor: focusBorder },
              },
            }}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: { sm: "center" } }}>
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            sx={{
              minWidth: 180,
              backgroundColor: colors.greenAccent[500],
              color: colors.primary[900],
              fontWeight: 600,
              "&:hover": {
                backgroundColor: colors.greenAccent[400],
              },
              "&.Mui-disabled": {
                backgroundColor: alpha(colors.greenAccent[500], 0.4),
                color: alpha(colors.primary[900], 0.6),
              },
            }}
          >
            {loading ? "Confirmando..." : "Confirmar pago"}
          </Button>
          {feedback && (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color:
                  feedback.type === "success"
                    ? colors.greenAccent[400]
                    : colors.redAccent[400],
              }}
            >
              {feedback.message}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
