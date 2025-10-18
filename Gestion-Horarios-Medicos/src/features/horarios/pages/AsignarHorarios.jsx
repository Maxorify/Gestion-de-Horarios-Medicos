import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import dayjs from "dayjs";

import { listarDoctores } from "@/services/doctores.js";
import { listarDisponibilidadPorDoctor, rangoSemana } from "@/services/disponibilidad.js";

import WeeklyPlanner from "../components/WeeklyPlanner.jsx";

function normalizeToMonday(date) {
  if (!date) {
    return null;
  }
  const day = date.day();
  const diff = (day + 6) % 7;
  return date.startOf("day").subtract(diff, "day");
}

export default function AsignarHorarios() {
  const [doctores, setDoctores] = useState([]);
  const [doctoresLoading, setDoctoresLoading] = useState(false);
  const [doctoresError, setDoctoresError] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [weekStart, setWeekStart] = useState(() => normalizeToMonday(dayjs()));
  const [reloadError, setReloadError] = useState("");
  const [lastReload, setLastReload] = useState(null);

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

  const doctorOptions = useMemo(
    () =>
      doctores.map((doctor) => ({
        id: doctor.id,
        nombre: doctor?.personas?.nombre_completo || doctor?.nombre || "Sin nombre",
      })),
    [doctores],
  );

  const handleDoctorChange = (event) => {
    const value = event.target.value;
    setSelectedDoctorId(value === "" ? null : Number(value));
  };

  const handleWeekChange = (value) => {
    setWeekStart(value ? normalizeToMonday(value) : null);
  };

  const reload = useCallback(async () => {
    if (!selectedDoctorId || !weekStart) {
      return;
    }
    setReloadError("");
    try {
      const [inicioSemana, finSemana] = rangoSemana(weekStart);
      await listarDisponibilidadPorDoctor(selectedDoctorId, inicioSemana, finSemana);
      setLastReload(dayjs());
    } catch (error) {
      setReloadError(error?.message || "No se pudo actualizar la disponibilidad.");
    }
  }, [selectedDoctorId, weekStart]);

  useEffect(() => {
    if (selectedDoctorId && weekStart) {
      reload();
    }
  }, [selectedDoctorId, weekStart, reload]);

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
                  value={selectedDoctorId ?? ""}
                  onChange={handleDoctorChange}
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
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Semana"
                value={weekStart}
                onChange={handleWeekChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {reloadError && <Alert severity="error">{reloadError}</Alert>}
            {lastReload && (
              <Typography variant="body2" color="text.secondary">
                Última actualización: {lastReload.format("DD/MM/YYYY HH:mm")}
              </Typography>
            )}
            <WeeklyPlanner doctorId={selectedDoctorId} weekStart={weekStart} onChange={reload} />
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
