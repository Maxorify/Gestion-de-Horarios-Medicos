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
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState } from "react";
import { guardarPaciente } from "@/services/pacientes";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/es";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function RegistroPacienteDialog({ open, onClose }) {
  const theme = useTheme();

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

  function formateaRut(rut) {
    rut = rut.replace(/[^0-9kK]/g, "");
    if (rut.length === 0) return "";
    let cuerpo = rut.slice(0, -1);
    let dv = rut.slice(-1).toUpperCase();
    cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return cuerpo + (cuerpo ? "-" : "") + dv;
  }
  function rutLimpio(rut) {
    return rut.replace(/\./g, "").replace(/-/g, "");
  }
  function validaRut(rut) {
    rut = rut.replace(/\./g, "").replace(/-/g, "");
    if (!/^\d{7,8}[0-9kK]{1}$/.test(rut)) return false;
    let cuerpo = rut.slice(0, -1);
    let dv = rut.slice(-1).toUpperCase();
    let suma = 0,
      multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i]) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    let dvEsperado = 11 - (suma % 11);
    dvEsperado =
      dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();
    return dv === dvEsperado;
  }
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
      value = formateaRut(value);
      newErrors.rut =
        value.replace(/\./g, "").replace(/-/g, "").length < 8
          ? "RUT muy corto"
          : !validaRut(value)
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
    validaRut(formData.rut) &&
    formData.correo.trim() &&
    validaCorreo(formData.correo) &&
    validaTelefono(formData.telefonoNumero) &&
    formData.fechaNacimiento;

  const pinBlue = "#3378FF";

  const pickerFieldStyles =
    theme.palette.mode === "dark"
      ? {
          bgcolor: "#23252b",
          color: "#fff",
          "& input": { color: "#fff" },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#8883",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: pinBlue,
          },
        }
      : {
          bgcolor: "#fafbfc",
        };

  const primaryBtn =
    theme.palette.mode === "dark"
      ? {
          background: "#27427c",
          color: "#fff",
          "&:hover": {
            background: "#355cb6",
          },
        }
      : {};

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

  // SOLO este pacienteBD dentro del handleSubmit
  const handleSubmit = async () => {
    const pacienteBD = {
      nombres_apellidos: `${formData.nombres} ${formData.apellidos}`.trim(),
      rut: rutLimpio(formData.rut),
      email: formData.correo,
      telefono: `${formData.telefonoCodigo}${formData.telefonoNumero}`,
      fecha_nacimiento: dayjs(formData.fechaNacimiento).format("YYYY-MM-DD"),
      // creado_en: dayjs().tz("America/Santiago").format("YYYY-MM-DD HH:mm:ss"), // opcional si quieres forzar hora local
    };
    try {
      await guardarPaciente(pacienteBD);
      alert("¡Paciente registrado exitosamente!");
      onClose();
      resetForm();
    } catch (error) {
      alert("Error al registrar paciente: " + error.message);
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
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!isFormValid}
          sx={{
            fontWeight: "bold",
            ...primaryBtn,
            boxShadow: "0 2px 8px 0 rgba(51,120,255,0.08)",
          }}
        >
          REGISTRAR PACIENTE
        </Button>
      </DialogActions>
    </Dialog>
  );
}
