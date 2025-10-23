// components/RegistroPacienteDialog.jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  useTheme,
  Box,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState } from "react";
import { registrarPacienteRPC } from "@/services/pacientes";
import { useUser } from "@/hooks/useUser";
import { cleanRutValue, formatRut, isValidRut } from "@/utils/rut";
import { tokens } from "@/theme";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/es";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function RegistroPacienteDialog({ open, onClose, onSuccess }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const pinBlue = colors.blueAccent[500];
  const { user } = useUser();

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    rut: "",
    correo: "",
    telefonoCodigo: "+56",
    telefonoNumero: "",
    fechaNacimiento: null,
  });

  const [errors, setErrors] = useState({
    rut: "",
    correo: "",
    telefonoNumero: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function validaCorreo(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  }
  function validaTelefono(tel) {
    return /^\d{8,9}$/.test(tel);
  }

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    let newErrors = { ...errors };
    if (field === "telefonoNumero") {
      value = value.replace(/\D/g, "");
      newErrors.telefonoNumero =
        value.length < 8 || value.length > 9 ? "Debe tener 8 o 9 dígitos" : "";
    }
    if (field === "rut") {
      value = formatRut(value);
      newErrors.rut =
        value.replace(/\./g, "").replace(/-/g, "").length < 8
          ? "RUT muy corto"
          : value && !isValidRut(value)
          ? "RUT inválido"
          : "";
    }
    if (field === "correo") {
      newErrors.correo =
        value.length > 0 && !validaCorreo(value)
          ? "Formato de correo inválido"
          : "";
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors(newErrors);
  };

  const handleDateChange = (newDate) => {
    setFormData((prev) => ({ ...prev, fechaNacimiento: newDate }));
  };

  const isFormValid =
    formData.nombres.trim() &&
    formData.apellidos.trim() &&
    formData.rut.trim() &&
    isValidRut(formData.rut) &&
    formData.correo.trim() &&
    validaCorreo(formData.correo) &&
    validaTelefono(formData.telefonoNumero) &&
    formData.fechaNacimiento;

  const isDark = theme.palette.mode === "dark";
  const fieldBackground = isDark
    ? alpha(theme.palette.background.paper, 0.9)
    : alpha(theme.palette.background.default, 0.9);
  const outlineColor = alpha(theme.palette.divider, isDark ? 0.8 : 1);
  const pickerFieldStyles = {
    bgcolor: fieldBackground,
    color: theme.palette.text.primary,
    "& input": { color: theme.palette.text.primary },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: outlineColor,
      transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
    },
  };

  const primaryBtn = {
    background: theme.palette.primary.main,
    color: theme.palette.getContrastText(theme.palette.primary.main),
    "&:hover": {
      background: alpha(theme.palette.primary.main, 0.85),
    },
  };

  const resetForm = () => {
    setFormData({
      nombres: "",
      apellidos: "",
      rut: "",
      correo: "",
      telefonoCodigo: "+56",
      telefonoNumero: "",
      fechaNacimiento: null,
    });
    setErrors({
      rut: "",
      correo: "",
      telefonoNumero: "",
    });
  };

  const handleSubmit = async () => {
    if (submitting || !isFormValid) return;
    if (!user?.usuario_id_legacy) {
      alert(
        "No hay sesión local válida (falta usuario_id_legacy). Inicia sesión nuevamente.",
      );
      return;
    }

    const nombres = formData.nombres.trim();
    const apellidos = formData.apellidos.trim();
    const [apellidoPaterno = "", ...restApellidos] = apellidos.split(/\s+/);
    const apellidoMaterno = restApellidos.join(" ");

    const telefonoPrincipal = `${formData?.telefonoCodigo ?? ""}${formData?.telefonoNumero ?? ""}`.replace(
      /\s+/g,
      "",
    );

    const personaPayload = {
      nombre: nombres,
      apellido_paterno: apellidoPaterno || null,
      apellido_materno: apellidoMaterno || null,
      rut: cleanRutValue(formData.rut),
      email: formData.correo.trim(),
      telefono_principal: telefonoPrincipal || null,
      telefono_secundario: null,
      fecha_nacimiento: formData.fechaNacimiento
        ? dayjs(formData.fechaNacimiento).format("YYYY-MM-DD")
        : null,
    };

    if (!personaPayload.fecha_nacimiento) {
      delete personaPayload.fecha_nacimiento;
    }

    const pacientePayload = {
      alerta_medica_general: null,
      contacto_emergencia_nombre: null,
      contacto_emergencia_telefono: null,
    };

    try {
      setSubmitting(true);
      const idemKey = `reg-${personaPayload.email}-${Date.now()}`;
      const nuevoPacienteId = await registrarPacienteRPC({
        persona: personaPayload,
        paciente: pacientePayload,
        idemKey,
        usuarioIdLegacy: user.usuario_id_legacy,
      });

      onSuccess?.(nuevoPacienteId);
      alert("¡Paciente registrado exitosamente!");
      onClose?.();
      resetForm();
    } catch (error) {
      alert("Error al registrar paciente: " + (error?.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "15px" },
      }}
    >
      <Box
        sx={{
          background: pinBlue,
          color: "#fff",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          boxShadow:
            "0 8px 30px 0 rgba(51,120,255,0.30), 0 2px 8px 0 rgba(0,0,0,0.06)",
        }}
      >
        <DialogTitle
          sx={{
            color: "#fff",
            fontWeight: "bold",
            fontSize: "2.6rem",
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
            px: 3,
            pt: 2.5,
            pb: 2,
            fontFamily: "inherit",
            letterSpacing: "0.01em",
            lineHeight: 1.1,
          }}
        >
          Registro de nuevo paciente
        </DialogTitle>
      </Box>
      <Box sx={{ height: 16, background: "transparent" }} />

      <DialogContent sx={{ pt: 0, pb: 3 }}>
        <Grid container spacing={6} sx={{ px: 4 }}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Nombre(s)
            </Typography>
            <TextField
              label="Ej: Juan José"
              fullWidth
              value={formData.nombres}
              onChange={handleChange("nombres")}
              autoFocus
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Apellido(s)
            </Typography>
            <TextField
              label="Ej: Pérez Díaz"
              fullWidth
              value={formData.apellidos}
              onChange={handleChange("apellidos")}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              RUT
            </Typography>
            <TextField
              label="Ej: 12.345.678-9"
              fullWidth
              value={formData.rut}
              onChange={handleChange("rut")}
              error={!!errors.rut}
              helperText={errors.rut}
              inputProps={{ maxLength: 12 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Correo Electrónico
            </Typography>
            <TextField
              label="ejemplo@gmail.com"
              fullWidth
              value={formData.correo}
              onChange={handleChange("correo")}
              type="email"
              error={!!errors.correo}
              helperText={errors.correo}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Código del país
            </Typography>
            <TextField
              fullWidth
              value={formData.telefonoCodigo}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Número de teléfono
            </Typography>
            <TextField
              label="Ej: 912345678"
              fullWidth
              value={formData.telefonoNumero}
              onChange={handleChange("telefonoNumero")}
              error={!!errors.telefonoNumero}
              helperText={errors.telefonoNumero}
              inputProps={{ maxLength: 9 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Fecha de nacimiento
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <DatePicker
                label="Fecha de nacimiento"
                value={formData.fechaNacimiento}
                onChange={handleDateChange}
                format="DD-MM-YYYY"
                views={["year", "month", "day"]}
                disableFuture
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    sx: pickerFieldStyles,
                  },
                }}
                sx={pickerFieldStyles}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 4, py: 2, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="text"
          color="inherit"
          sx={{ fontWeight: 500 }}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!isFormValid || submitting}
          sx={{
            fontWeight: "bold",
            ...primaryBtn,
            boxShadow: "0 2px 8px 0 rgba(51,120,255,0.08)",
          }}
        >
          {submitting ? "Registrando..." : "REGISTRAR PACIENTE"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
