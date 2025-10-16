import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

import { listarDoctores } from "@/services/doctores.js";
import {
  crearDisponibilidad,
  listarDisponibilidadPorDoctor,
} from "@/services/disponibilidad.js";

const DURACION_BLOQUE_OPTIONS = [10, 15, 20, 30, 45, 60];

export default function AsignarHorarios() {
  const [doctores, setDoctores] = useState([]);
  const [doctoresLoading, setDoctoresLoading] = useState(false);
  const [doctoresError, setDoctoresError] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const [disponibilidades, setDisponibilidades] = useState([]);
  const [disponibilidadesLoading, setDisponibilidadesLoading] = useState(false);
  const [disponibilidadesError, setDisponibilidadesError] = useState("");

  const [fechaInicio, setFechaInicio] = useState(null);
  const [horaInicio, setHoraInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [horaFin, setHoraFin] = useState(null);
  const [duracionBloque, setDuracionBloque] = useState(DURACION_BLOQUE_OPTIONS[3]);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const loadDoctores = async () => {
      setDoctoresLoading(true);
      setDoctoresError("");
      try {
        const data = await listarDoctores();
        setDoctores(data ?? []);
      } catch (error) {
        setDoctoresError(error?.message || "No se pudieron cargar los doctores.");
        setDoctores([]);
      } finally {
        setDoctoresLoading(false);
      }
    };

    loadDoctores();
  }, []);

  const loadDisponibilidades = useCallback(
    async (doctorId) => {
      if (!doctorId) {
        setDisponibilidades([]);
        return;
      }
      setDisponibilidadesLoading(true);
      setDisponibilidadesError("");
      try {
        const data = await listarDisponibilidadPorDoctor(doctorId);
        setDisponibilidades(data ?? []);
      } catch (error) {
        setDisponibilidadesError(
          error?.message || "No se pudo obtener la disponibilidad del doctor seleccionado.",
        );
        setDisponibilidades([]);
      } finally {
        setDisponibilidadesLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadDisponibilidades(selectedDoctorId);
  }, [loadDisponibilidades, selectedDoctorId]);

  const doctorOptions = useMemo(
    () =>
      doctores.map((doctor) => ({
        id: doctor.id,
        nombre: doctor?.personas?.nombre_completo || doctor?.nombre || "Sin nombre",
      })),
    [doctores],
  );

  const resetForm = () => {
    setFechaInicio(null);
    setHoraInicio(null);
    setFechaFin(null);
    setHoraFin(null);
    setDuracionBloque(DURACION_BLOQUE_OPTIONS[3]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!selectedDoctorId) {
      setFormError("Debes seleccionar un doctor para asignar disponibilidad.");
      return;
    }
    if (!fechaInicio || !horaInicio || !fechaFin || !horaFin) {
      setFormError("Completa las fechas y horas de inicio y fin.");
      return;
    }

    const fechaHoraInicio = dayjs(fechaInicio)
      .set("hour", dayjs(horaInicio).hour())
      .set("minute", dayjs(horaInicio).minute())
      .set("second", 0)
      .set("millisecond", 0);

    const fechaHoraFin = dayjs(fechaFin)
      .set("hour", dayjs(horaFin).hour())
      .set("minute", dayjs(horaFin).minute())
      .set("second", 0)
      .set("millisecond", 0);

    if (!fechaHoraFin.isAfter(fechaHoraInicio)) {
      setFormError("La fecha y hora de fin debe ser posterior al inicio.");
      return;
    }

    const payload = {
      doctor_id: selectedDoctorId,
      fecha_hora_inicio: fechaHoraInicio.toISOString(),
      fecha_hora_fin: fechaHoraFin.toISOString(),
      duracion_bloque_minutos: Number(duracionBloque),
    };

    setFormSubmitting(true);
    try {
      await crearDisponibilidad(payload);
      await loadDisponibilidades(selectedDoctorId);
      resetForm();
    } catch (error) {
      setFormError(error?.message || "No se pudo crear la disponibilidad.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Asignar disponibilidad a doctores
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="doctor-select-label">Doctor</InputLabel>
                <Select
                  labelId="doctor-select-label"
                  label="Doctor"
                  value={selectedDoctorId}
                  onChange={(event) => setSelectedDoctorId(event.target.value)}
                  disabled={doctoresLoading}
                >
                  {doctorOptions.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {doctoresLoading && (
              <Grid item>
                <CircularProgress size={24} />
              </Grid>
            )}
          </Grid>
          {doctoresError && (
            <Box mt={2}>
              <Alert severity="error">{doctoresError}</Alert>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Nueva disponibilidad
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Fecha inicio"
                  value={fechaInicio}
                  onChange={setFechaInicio}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TimePicker
                  label="Hora inicio"
                  value={horaInicio}
                  onChange={setHoraInicio}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Fecha fin"
                  value={fechaFin}
                  onChange={setFechaFin}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TimePicker
                  label="Hora fin"
                  value={horaFin}
                  onChange={setHoraFin}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Duración del bloque (min)"
                  type="number"
                  fullWidth
                  value={duracionBloque}
                  onChange={(event) => setDuracionBloque(event.target.value)}
                  inputProps={{ min: 5 }}
                />
              </Grid>
              {formError && (
                <Grid item xs={12}>
                  <Alert severity="error">{formError}</Alert>
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? "Guardando..." : "Crear disponibilidad"}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Disponibilidades del doctor
          </Typography>
          {disponibilidadesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : disponibilidadesError ? (
            <Alert severity="error">{disponibilidadesError}</Alert>
          ) : disponibilidades.length === 0 ? (
            <Typography color="text.secondary">
              {selectedDoctorId
                ? "No hay disponibilidades registradas para este doctor."
                : "Selecciona un doctor para ver su disponibilidad."}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Inicio</TableCell>
                    <TableCell>Fin</TableCell>
                    <TableCell>Duración (min)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disponibilidades.map((item) => {
                    const inicio = dayjs(item.fecha_hora_inicio);
                    const fin = dayjs(item.fecha_hora_fin);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{inicio.format("DD/MM/YYYY HH:mm")}</TableCell>
                        <TableCell>{fin.format("DD/MM/YYYY HH:mm")}</TableCell>
                        <TableCell>{item.duracion_bloque_minutos}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
