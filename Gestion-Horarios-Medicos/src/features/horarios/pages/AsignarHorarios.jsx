import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { esES as dataGridEsES } from "@mui/x-data-grid/locales";
import { DatePicker } from "@mui/x-date-pickers";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import dayjs from "dayjs";

import AvatarCell from "@/components/AvatarCell.jsx";
import { listarDoctores } from "@/services/doctores.js";
import {
  eliminarTurnoDoctor,
  generarHorarios,
  listarSlotsProximos,
  listarTurnosDoctor,
  upsertTurnoDoctor,
} from "@/services/horarios.js";

const DEBOUNCE_TIME = 220;
const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60];

const WEEKDAYS = [
  { label: "Domingo", value: 0 },
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
];

function normalizeTimeString(value) {
  if (!value) return "00:00";
  const [hh = "00", mm = "00"] = value.split(":");
  return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}`;
}

function toMinutes(value) {
  const [hours = "0", minutes = "0"] = normalizeTimeString(value).split(":");
  return Number(hours) * 60 + Number(minutes);
}

function displayTime(value) {
  const [hours, minutes] = normalizeTimeString(value).split(":");
  return `${hours}:${minutes}`;
}

function buildRpcSummary(result) {
  if (result == null) return null;
  if (typeof result === "number") {
    return `Se generaron ${result} slots.`;
  }
  if (typeof result === "string") {
    return result;
  }
  if (Array.isArray(result)) {
    return buildRpcSummary(result[0]);
  }
  const keys = ["total", "total_generado", "total_generados", "total_creados", "creados", "created", "count"];
  for (const key of keys) {
    if (result[key] != null) {
      return `Se generaron ${result[key]} slots.`;
    }
  }
  const entries = Object.entries(result || {});
  if (entries.length > 0) {
    return `Horarios generados correctamente (${entries
      .map(([key, val]) => `${key}: ${val}`)
      .join(", ")}).`;
  }
  return null;
}

export default function AsignarHorarios() {
  const theme = useTheme();
  const [doctores, setDoctores] = useState([]);
  const [doctoresLoading, setDoctoresLoading] = useState(false);
  const [doctoresError, setDoctoresError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  const [turnos, setTurnos] = useState([]);
  const [turnosLoading, setTurnosLoading] = useState(false);

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [turnoForm, setTurnoForm] = useState({
    weekday: 1,
    hora_inicio: "",
    hora_fin: "",
    slot_minutos: 30,
  });
  const [turnoSaving, setTurnoSaving] = useState(false);
  const [turnoFormError, setTurnoFormError] = useState("");
  const [turnoActionLoading, setTurnoActionLoading] = useState({});

  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [overwrite, setOverwrite] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const fetchIdRef = useRef(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, DEBOUNCE_TIME);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchDoctores = useCallback(
    async (currentSearch) => {
      fetchIdRef.current += 1;
      const currentId = fetchIdRef.current;
      setDoctoresLoading(true);
      setDoctoresError("");
      try {
        const data = await listarDoctores({ search: currentSearch, limit: 200, offset: 0 });
        if (fetchIdRef.current === currentId) {
          setDoctores(data);
        }
      } catch (error) {
        if (fetchIdRef.current === currentId) {
          setDoctoresError(error?.message || "No se pudieron cargar los doctores.");
          setDoctores([]);
        }
        setSnackbar({ open: true, severity: "error", message: error?.message || "Error al listar doctores." });
      } finally {
        if (fetchIdRef.current === currentId) {
          setDoctoresLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    fetchDoctores(debouncedSearch);
  }, [debouncedSearch, fetchDoctores]);

  const doctorColumns = useMemo(
    () => [
      {
        field: "avatar",
        headerName: "",
        width: 70,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <AvatarCell name={params.row.nombre} avatarUrl={params.row.avatar_url} />
        ),
      },
      { field: "nombre", headerName: "Nombre", flex: 1, minWidth: 180 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
      { field: "especialidades", headerName: "Especialidades", flex: 1, minWidth: 200 },
    ],
    [],
  );

  const handleSelectDoctor = useCallback((doctorId) => {
    setSelectedDoctorId((prev) => (prev === doctorId ? prev : doctorId));
  }, []);

  const loadTurnos = useCallback(
    async (doctorId) => {
      if (!doctorId) {
        setTurnos([]);
        return;
      }
      setTurnosLoading(true);
      try {
        const data = await listarTurnosDoctor(doctorId);
        setTurnos(data);
      } catch (error) {
        setTurnos([]);
        setSnackbar({ open: true, severity: "error", message: error?.message || "Error al cargar turnos." });
      } finally {
        setTurnosLoading(false);
      }
    },
    [],
  );

  const loadSlots = useCallback(
    async (doctorId) => {
      if (!doctorId) {
        setSlots([]);
        return;
      }
      setSlotsLoading(true);
      try {
        const data = await listarSlotsProximos(doctorId, 50);
        setSlots(data);
      } catch (error) {
        setSlots([]);
        setSnackbar({ open: true, severity: "error", message: error?.message || "Error al cargar los slots." });
      } finally {
        setSlotsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedDoctorId) return;
    loadTurnos(selectedDoctorId);
    loadSlots(selectedDoctorId);
    setGenerationSummary("");
  }, [selectedDoctorId, loadTurnos, loadSlots]);

  const filteredTurnosByWeekday = useMemo(() => {
    return turnos.reduce((acc, turno) => {
      (acc[turno.weekday] ||= []).push(turno);
      return acc;
    }, {});
  }, [turnos]);

  const hasOverlap = useCallback(
    (weekday, horaInicio, horaFin) => {
      const startMinutes = toMinutes(horaInicio);
      const endMinutes = toMinutes(horaFin);
      const turnosDia = (filteredTurnosByWeekday[weekday] || []).filter(
        (turno) => turno.activo !== false,
      );
      return turnosDia.some((turno) => {
        const turnoInicio = toMinutes(turno.hora_inicio);
        const turnoFin = toMinutes(turno.hora_fin);
        return startMinutes < turnoFin && turnoInicio < endMinutes;
      });
    },
    [filteredTurnosByWeekday],
  );

  const handleTurnoFieldChange = useCallback((field) => (event) => {
    const value = field === "slot_minutos" || field === "weekday" ? Number(event.target.value) : event.target.value;
    setTurnoForm((prev) => ({ ...prev, [field]: value }));
    setTurnoFormError("");
  }, []);

  const resetTurnoForm = useCallback(() => {
    setTurnoForm({ weekday: 1, hora_inicio: "", hora_fin: "", slot_minutos: 30 });
    setTurnoFormError("");
  }, []);

  const handleAgregarTurno = useCallback(async () => {
    if (!selectedDoctorId) {
      setSnackbar({ open: true, severity: "error", message: "Selecciona un doctor primero." });
      return;
    }
    const { weekday, hora_inicio, hora_fin, slot_minutos } = turnoForm;
    if (!hora_inicio || !hora_fin) {
      setTurnoFormError("Debe ingresar hora de inicio y fin.");
      return;
    }
    if (toMinutes(hora_fin) <= toMinutes(hora_inicio)) {
      setTurnoFormError("La hora de fin debe ser posterior a la de inicio.");
      return;
    }
    if (!SLOT_OPTIONS.includes(Number(slot_minutos))) {
      setTurnoFormError("Seleccione una duración válida.");
      return;
    }
    if (hasOverlap(weekday, hora_inicio, hora_fin)) {
      setTurnoFormError("El turno se solapa con uno existente.");
      return;
    }

    setTurnoSaving(true);
    try {
      await upsertTurnoDoctor({
        doctor_id: selectedDoctorId,
        weekday,
        hora_inicio,
        hora_fin,
        slot_minutos,
        activo: true,
      });
      await loadTurnos(selectedDoctorId);
      setSnackbar({ open: true, severity: "success", message: "Turno guardado correctamente." });
      resetTurnoForm();
    } catch (error) {
      setSnackbar({ open: true, severity: "error", message: error?.message || "No se pudo guardar el turno." });
    } finally {
      setTurnoSaving(false);
    }
  }, [selectedDoctorId, turnoForm, hasOverlap, loadTurnos, resetTurnoForm]);

  const setTurnoLoading = useCallback((id, value) => {
    setTurnoActionLoading((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleToggleActivo = useCallback(
    async (turno) => {
      setTurnoLoading(turno.id, true);
      try {
        await upsertTurnoDoctor({
          id: turno.id,
          doctor_id: selectedDoctorId,
          weekday: turno.weekday,
          hora_inicio: turno.hora_inicio,
          hora_fin: turno.hora_fin,
          slot_minutos: turno.slot_minutos,
          activo: !turno.activo,
        });
        await loadTurnos(selectedDoctorId);
        setSnackbar({
          open: true,
          severity: "success",
          message: !turno.activo ? "Turno habilitado." : "Turno deshabilitado.",
        });
      } catch (error) {
        setSnackbar({ open: true, severity: "error", message: error?.message || "Error al actualizar turno." });
      } finally {
        setTurnoLoading(turno.id, false);
      }
    },
    [selectedDoctorId, loadTurnos, setTurnoLoading],
  );

  const handleEliminarTurno = useCallback(
    async (turnoId) => {
      setTurnoLoading(turnoId, true);
      try {
        await eliminarTurnoDoctor(turnoId);
        await loadTurnos(selectedDoctorId);
        setSnackbar({ open: true, severity: "success", message: "Turno eliminado." });
      } catch (error) {
        setSnackbar({ open: true, severity: "error", message: error?.message || "No se pudo eliminar el turno." });
      } finally {
        setTurnoLoading(turnoId, false);
      }
    },
    [selectedDoctorId, loadTurnos, setTurnoLoading],
  );

  const handleGenerarHorarios = useCallback(async () => {
    if (!selectedDoctorId) {
      setSnackbar({ open: true, severity: "error", message: "Selecciona un doctor." });
      return;
    }
    if (!desde || !hasta) {
      setSnackbar({ open: true, severity: "error", message: "Completa las fechas de inicio y fin." });
      return;
    }
    if (hasta.isBefore(desde)) {
      setSnackbar({ open: true, severity: "error", message: "La fecha hasta debe ser posterior o igual a desde." });
      return;
    }

    setGenerating(true);
    setGenerationSummary("");
    try {
      const payload = {
        doctor_id: selectedDoctorId,
        desde: desde.format("YYYY-MM-DD"),
        hasta: hasta.format("YYYY-MM-DD"),
        overwrite,
      };
      const result = await generarHorarios(payload);
      const summary = buildRpcSummary(result);
      if (summary) {
        setGenerationSummary(summary);
      }
      setSnackbar({ open: true, severity: "success", message: summary || "Horarios generados correctamente." });
      await loadSlots(selectedDoctorId);
    } catch (error) {
      setSnackbar({ open: true, severity: "error", message: error?.message || "No se pudieron generar los horarios." });
    } finally {
      setGenerating(false);
    }
  }, [selectedDoctorId, desde, hasta, overwrite, loadSlots]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const isGenerarDisabled = !selectedDoctorId || !desde || !hasta || generating;

  const sortedTurnos = useMemo(() => {
    return [...turnos].sort((a, b) => {
      if (a.weekday !== b.weekday) return a.weekday - b.weekday;
      return toMinutes(a.hora_inicio) - toMinutes(b.hora_inicio);
    });
  }, [turnos]);

  const weekdayLabel = useCallback((value) => WEEKDAYS.find((day) => day.value === value)?.label || value, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Asignar horarios a doctores
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Define turnos semanales y genera los slots de atención disponibles.
        </Typography>
      </Box>

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={5} display="flex">
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              flex: 1,
            }}
          >
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Doctores
              </Typography>
              <TextField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: "100%",
                  "& .MuiInputBase-root": {
                    borderRadius: 999,
                    backgroundColor: theme.palette.background.paper,
                  },
                }}
              />
            </Stack>
            <Box sx={{ flex: 1, width: "100%", overflow: "hidden" }}>
              <DataGrid
                rows={doctores}
                columns={doctorColumns}
                getRowId={(row) => row.id}
                disableColumnMenu
                disableRowSelectionOnClick
                loading={doctoresLoading}
                pagination
                pageSizeOptions={[5, 10, 20]}
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                rowSelectionModel={selectedDoctorId ? [selectedDoctorId] : []}
                onRowClick={(params) => handleSelectDoctor(params.id)}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  minHeight: 320,
                  maxHeight: 520,
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor:
                      theme.palette.mode === "light"
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(33,33,33,0.9)",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    cursor: "pointer",
                  },
                  [`& .MuiDataGrid-row[data-id="${selectedDoctorId}"]`]: {
                    backgroundColor:
                      theme.palette.mode === "light"
                        ? "rgba(51,120,255,0.08)"
                        : "rgba(51,120,255,0.16)",
                  },
                }}
                localeText={
                  dataGridEsES?.localeText ??
                  dataGridEsES?.components?.MuiDataGrid?.defaultProps?.localeText ??
                  {}
                }
              />
            </Box>
            {doctoresError && (
              <Alert severity="error" variant="outlined">
                {doctoresError}
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={7} display="flex">
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                p: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <EventRepeatRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Turnos semanales
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Configura los turnos recurrentes por día de la semana.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="weekday-select-label">Día</InputLabel>
                    <Select
                      labelId="weekday-select-label"
                      label="Día"
                      value={turnoForm.weekday}
                      onChange={handleTurnoFieldChange("weekday")}
                    >
                      {WEEKDAYS.map((day) => (
                        <MenuItem key={day.value} value={day.value}>
                          {day.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Hora inicio"
                    type="time"
                    value={turnoForm.hora_inicio}
                    onChange={handleTurnoFieldChange("hora_inicio")}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Hora fin"
                    type="time"
                    value={turnoForm.hora_fin}
                    onChange={handleTurnoFieldChange("hora_fin")}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="slot-duration-label">Duración slot</InputLabel>
                    <Select
                      labelId="slot-duration-label"
                      label="Duración slot"
                      value={turnoForm.slot_minutos}
                      onChange={handleTurnoFieldChange("slot_minutos")}
                    >
                      {SLOT_OPTIONS.map((minutes) => (
                        <MenuItem key={minutes} value={minutes}>
                          {minutes} minutos
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={8} display="flex" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Los turnos no deben solaparse en el mismo día. Se generarán slots según la duración.
                  </Typography>
                </Grid>
              </Grid>
              {turnoFormError && (
                <FormHelperText error sx={{ mt: -1 }}>
                  {turnoFormError}
                </FormHelperText>
              )}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={resetTurnoForm} disabled={turnoSaving}>
                  Limpiar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={handleAgregarTurno}
                  disabled={turnoSaving || !selectedDoctorId}
                >
                  Agregar turno
                </Button>
              </Stack>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Día</TableCell>
                      <TableCell>Inicio</TableCell>
                      <TableCell>Fin</TableCell>
                      <TableCell>Duración</TableCell>
                      <TableCell align="center">Activo</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {turnosLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                            <CircularProgress size={18} />
                            <Typography variant="body2" color="text.secondary">
                              Cargando turnos…
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ) : sortedTurnos.length ? (
                      sortedTurnos.map((turno) => (
                        <TableRow key={turno.id} hover>
                          <TableCell>{weekdayLabel(turno.weekday)}</TableCell>
                          <TableCell>{displayTime(turno.hora_inicio)}</TableCell>
                          <TableCell>{displayTime(turno.hora_fin)}</TableCell>
                          <TableCell>{`${turno.slot_minutos} min`}</TableCell>
                          <TableCell align="center">
                            <Switch
                              size="small"
                              checked={Boolean(turno.activo)}
                              onChange={() => handleToggleActivo(turno)}
                              disabled={Boolean(turnoActionLoading[turno.id])}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="error"
                              onClick={() => handleEliminarTurno(turno.id)}
                              disabled={Boolean(turnoActionLoading[turno.id])}
                              size="small"
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No hay turnos configurados para este doctor.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                p: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarMonthRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Generar horarios por rango
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Genera slots en el rango indicado utilizando los turnos semanales configurados.
              </Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <DatePickerField
                    label="Desde"
                    value={desde}
                    onChange={setDesde}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePickerField
                    label="Hasta"
                    value={hasta}
                    onChange={setHasta}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={overwrite}
                        onChange={(event) => setOverwrite(event.target.checked)}
                      />
                    }
                    label="Sobrescribir slots libres en el rango"
                  />
                </Grid>
              </Grid>

              {generationSummary && (
                <Alert severity="success" variant="outlined">
                  {generationSummary}
                </Alert>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={handleGenerarHorarios}
                  disabled={isGenerarDisabled}
                >
                  {generating ? "Generando…" : "Generar"}
                </Button>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                p: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Próximos slots
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vista previa de los próximos 50 slots disponibles o agendados para el doctor seleccionado.
              </Typography>

              {slotsLoading ? (
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ py: 2 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Cargando slots…
                  </Typography>
                </Stack>
              ) : slots.length ? (
                <List dense disablePadding sx={{ maxHeight: 320, overflowY: "auto" }}>
                  {slots.map((slot) => {
                    const fecha = dayjs(slot.fecha).format("DD/MM/YYYY");
                    const inicio = displayTime(slot.hora_inicio);
                    const fin = displayTime(slot.hora_fin);
                    const estado = slot.status === "libre" && !slot.paciente_id ? "Disponible" : "Asignado";
                    return (
                      <ListItem key={slot.id} divider>
                        <ListItemText
                          primary={`${fecha} · ${inicio} - ${fin}`}
                          secondary={estado}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay slots generados para este doctor en los próximos días.
                </Typography>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function DatePickerField({ label, value, onChange }) {
  return (
    <DatePicker
      label={label}
      value={value}
      onChange={onChange}
      format="DD/MM/YYYY"
      slotProps={{
        textField: {
          fullWidth: true,
          size: "small",
        },
      }}
    />
  );
}
