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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useState } from "react";

export default function RegistroPacienteDialog({ open, onClose }) {
  const theme = useTheme();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefonoCodigo: "+56",
    telefonoNumero: "",
    fechaNacimiento: null,
  });

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleDateChange = (newDate) => {
    setFormData((prev) => ({ ...prev, fechaNacimiento: newDate }));
  };

  const handleSubmit = () => {
    // Aquí se enviaría la data a Supabase u otro destino
    console.log("Paciente registrado:", formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        Registro de nuevo paciente
      </DialogTitle>

      <DialogContent sx={{ paddingTop: 4 }}>
        <Grid container spacing={3}>
          {/* Nombre y Apellido */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Nombre completo.</Typography>
            <TextField
              label="Nombre"
              fullWidth
              value={formData.nombre}
              onChange={handleChange("nombre")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">&nbsp;</Typography>
            <TextField
              label="Apellido"
              fullWidth
              value={formData.apellido}
              onChange={handleChange("apellido")}
            />
          </Grid>

          {/* Correo */}
          <Grid item xs={12}>
            <Typography variant="subtitle2">Correo Electrónico.</Typography>
            <TextField
              label="ejemplo@gmail.com"
              fullWidth
              value={formData.correo}
              onChange={handleChange("correo")}
            />
          </Grid>

          {/* Teléfono */}
          <Grid item xs={4} sm={3}>
            <Typography variant="subtitle2">Código del país</Typography>
            <TextField
              fullWidth
              value={formData.telefonoCodigo}
              onChange={handleChange("telefonoCodigo")}
            />
          </Grid>
          <Grid item xs={8} sm={9}>
            <Typography variant="subtitle2">Número de teléfono</Typography>
            <TextField
              fullWidth
              value={formData.telefonoNumero}
              onChange={handleChange("telefonoNumero")}
            />
          </Grid>

          {/* Fecha de nacimiento */}
          <Grid item xs={12}>
            <Typography variant="subtitle2">Fecha de nacimiento.</Typography>
            <DatePicker
              value={formData.fechaNacimiento}
              onChange={handleDateChange}
              format="DD-MM-YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined",
                },
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="text">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Registrar paciente
        </Button>
      </DialogActions>
    </Dialog>
  );
}
