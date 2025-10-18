import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { DataGrid } from "@mui/x-data-grid";
import { esES as dataGridEsES } from "@mui/x-data-grid/locales";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import "dayjs/locale/es";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useLocation, useNavigate } from "react-router-dom";
import { listarDoctores } from "@/services/doctores";
import { listarDisponibilidadPorDoctor } from "@/services/disponibilidad";
import { crearCita, listarCitasPorDoctor } from "@/services/citas";
import { tokenize, matchAllTokens, highlightRenderer } from "@/utils/search";
import { useUser } from "@/hooks/useUser";

dayjs.extend(customParseFormat);

const panelVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

function generarSlotsParaDia(disponibilidades, citas, fechaBase) {
  if (!fechaBase?.isValid?.()) return [];
  const inicioDia = fechaBase.startOf("day");
  const finDia = inicioDia.add(1, "day");

  const citasNormalizadas = (Array.isArray(citas) ? citas : [])
    .map((cita) => {
      const inicioRaw =
        cita?.fecha_hora_inicio_agendada ??
        cita?.fecha_hora_inicio ??
        cita?.disponibilidad?.fecha_hora_inicio ??
        null;
      if (!inicioRaw) return null;
      const inicio = dayjs(inicioRaw);
      if (!inicio.isValid()) return null;

      const duracionBloque = Number(cita?.disponibilidad?.duracion_bloque_minutos) || 0;
      const finRaw =
        cita?.fecha_hora_fin_agendada ??
        cita?.fecha_hora_fin ??
        cita?.disponibilidad?.fecha_hora_fin ??
        (duracionBloque > 0 ? inicio.add(duracionBloque, "minute").toISOString() : null);

      const fin = finRaw ? dayjs(finRaw) : null;
      if (!fin || !fin.isValid()) {
        if (duracionBloque > 0) {
          return { inicio, fin: inicio.add(duracionBloque, "minute") };
        }
        return null;
      }

      return { inicio, fin };
    })
    .filter(Boolean);

  const slots = [];
  (Array.isArray(disponibilidades) ? disponibilidades : []).forEach((disponibilidad) => {
    const inicioDisponibilidad = dayjs(disponibilidad?.fecha_hora_inicio);
    const finDisponibilidad = dayjs(disponibilidad?.fecha_hora_fin);
    const duracion = Number(disponibilidad?.duracion_bloque_minutos) || 0;

    if (!inicioDisponibilidad.isValid() || !finDisponibilidad.isValid() || duracion <= 0) {
      return;
    }

    const inicio = inicioDisponibilidad.isBefore(inicioDia) ? inicioDia : inicioDisponibilidad;
    const limite = finDisponibilidad.isAfter(finDia) ? finDia : finDisponibilidad;

    let currentStart = inicio;
    while (currentStart.isBefore(limite)) {
      const currentEnd = currentStart.add(duracion, "minute");
      if (currentEnd.isAfter(limite) || currentEnd.isAfter(finDisponibilidad)) {
        break;
      }

      const ocupado = citasNormalizadas.some(({ inicio: citaInicio, fin: citaFin }) => {
        return currentStart.isBefore(citaFin) && currentEnd.isAfter(citaInicio);
      });

      slots.push({
        id: `${disponibilidad.id}-${currentStart.toISOString()}`,
        disponibilidadId: disponibilidad.id,
        fechaHoraInicio: currentStart.toISOString(),
        fechaHoraFin: currentEnd.toISOString(),
        estado: ocupado ? "ocupado" : "disponible",
      });

      currentStart = currentEnd;
    }
  });

  return slots.sort((a, b) => dayjs(a.fechaHoraInicio).valueOf() - dayjs(b.fechaHoraInicio).valueOf());
}

function buildDoctorSearchString(doctor) {
  const persona = doctor?.persona ?? {};
  const nombres = persona.nombre ?? "";
  const apellidos = [persona.apellido_paterno, persona.apellido_materno]
    .filter(Boolean)
    .join(" ");
  const rut = persona.rut ?? "";
  const phone = (doctor?.persona?.telefono_principal || "").toLowerCase();
  const phone2 = (doctor?.persona?.telefono_secundario || "").toLowerCase();
  const phoneMatch = `${phone} ${phone2}`.trim();
  return [
    nombres,
    apellidos,
    rut,
    persona.email,
    phoneMatch,
    doctor?.especialidad_principal,
  ]
    .filter(Boolean)
    .join(" ");
}

function getDoctorNombre(persona) {
  if (!persona) return "";
  return [persona.nombre, persona.apellido_paterno, persona.apellido_materno]
    .filter(Boolean)
    .join(" ");
}

export default function SeleccionarHorarioDoctor() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { perfil } = useUser();
  const { pacienteId } = location.state || {};

  useEffect(() => {
    if (!pacienteId) {
      navigate("/admin/agendar", { replace: true });
    }
  }, [navigate, pacienteId]);

  const [doctores, setDoctores] = useState([]);
  const [cargandoDoctores, setCargandoDoctores] = useState(false);
  const [errorDoctores, setErrorDoctores] = useState("");
  const [query, setQuery] = useState("");
  const [qInternal, setQInternal] = useState("");
  const debounceRef = useRef(null);

  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const selectedDoctor = useMemo(
    () => doctores.find((d) => d.id === selectedDoctorId) || null,
    [doctores, selectedDoctorId],
  );

  const today = useMemo(() => dayjs().startOf("day"), []);
  const maxDate = useMemo(() => today.add(13, "day"), [today]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => dayjs().startOf("day"));

  const [disponibilidades, setDisponibilidades] = useState([]);
  const [citasDelDia, setCitasDelDia] = useState([]);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState("");
  const [errorCitas, setErrorCitas] = useState("");
  const [refreshCitasCounter, setRefreshCitasCounter] = useState(0);

  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(qInternal.trim());
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [qInternal]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setCargandoDoctores(true);
        setErrorDoctores("");
        const rows = await listarDoctores();
        if (!cancel) {
          setDoctores(rows ?? []);
        }
      } catch (error) {
        if (!cancel) setErrorDoctores(error.message || "No se pudieron cargar los doctores");
      } finally {
        if (!cancel) setCargandoDoctores(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!doctores.some((doctor) => doctor.id === selectedDoctorId)) {
      setSelectedDoctorId(null);
    }
  }, [doctores, selectedDoctorId]);

  const tokens = useMemo(() => tokenize(query), [query]);
  const filteredDoctores = useMemo(() => {
    if (tokens.length === 0) return doctores;
    return doctores.filter((doctor) => matchAllTokens(buildDoctorSearchString(doctor), tokens));
  }, [doctores, tokens]);

  const highlight = highlightRenderer(query);
  const columns = useMemo(
    () => [
      {
        field: "nombre",
        headerName: "Nombre",
        flex: 1,
        minWidth: 180,
        valueGetter: ({ row }) => getDoctorNombre(row?.persona),
        renderCell: ({ value }) => highlight(value ?? ""),
      },
      {
        field: "especialidad",
        headerName: "Especialidad",
        flex: 1.1,
        minWidth: 220,
        valueGetter: ({ row }) => row?.especialidad_principal ?? "",
        renderCell: ({ value }) => highlight(value ?? ""),
      },
      {
        field: "email",
        headerName: "Correo",
        flex: 1,
        minWidth: 210,
        valueGetter: ({ row }) => row?.persona?.email ?? "",
        renderCell: ({ value }) => highlight(value ?? ""),
      },
    ],
    [highlight],
  );

  useEffect(() => {
    if (!selectedDoctorId) {
      setDisponibilidades([]);
      setErrorDisponibilidad("");
      return;
    }

    let cancel = false;

    const fetchDisponibilidad = async () => {
      try {
        setCargandoDisponibilidad(true);
        setErrorDisponibilidad("");
        const fechaInicio = today.startOf("day").toISOString();
        const fechaFin = maxDate.endOf("day").toISOString();
        const data = await listarDisponibilidadPorDoctor(selectedDoctorId, fechaInicio, fechaFin);
        if (!cancel) {
          setDisponibilidades(data ?? []);
        }
      } catch (error) {
        if (!cancel) {
          setErrorDisponibilidad(
            error.message || "No se pudo obtener la disponibilidad del doctor seleccionado",
          );
          setDisponibilidades([]);
        }
      } finally {
        if (!cancel) {
          setCargandoDisponibilidad(false);
        }
      }
    };

    fetchDisponibilidad();

    return () => {
      cancel = true;
    };
  }, [selectedDoctorId, today, maxDate]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setCitasDelDia([]);
      setErrorCitas("");
      return;
    }

    let cancel = false;

    const fetchCitas = async () => {
      try {
        setCargandoCitas(true);
        setErrorCitas("");
        const fecha = fechaSeleccionada.startOf("day").format("YYYY-MM-DD");
        const data = await listarCitasPorDoctor(selectedDoctorId, fecha);
        if (!cancel) {
          setCitasDelDia(data ?? []);
        }
      } catch (error) {
        if (!cancel) {
          setErrorCitas(error.message || "No se pudieron obtener las citas del doctor");
          setCitasDelDia([]);
        }
      } finally {
        if (!cancel) {
          setCargandoCitas(false);
        }
      }
    };

    fetchCitas();

    return () => {
      cancel = true;
    };
  }, [selectedDoctorId, fechaSeleccionada, refreshCitasCounter]);

  useEffect(() => {
    setSelectedSlotId(null);
  }, [selectedDoctorId, fechaSeleccionada]);

  const slotsDelDia = useMemo(
    () => generarSlotsParaDia(disponibilidades, citasDelDia, fechaSeleccionada),
    [disponibilidades, citasDelDia, fechaSeleccionada],
  );

  const selectedSlot = useMemo(
    () => (selectedSlotId ? slotsDelDia.find((slot) => slot.id === selectedSlotId) || null : null),
    [selectedSlotId, slotsDelDia],
  );

  const cargandoSlots = cargandoDisponibilidad || cargandoCitas;
  const errorSlots = errorDisponibilidad || errorCitas;

  const handleReservarSlot = async () => {
    if (!selectedSlot || !selectedDoctor || !pacienteId) return;
    if (!perfil?.id) {
      setSnackbar({
        open: true,
        message: "No se pudo identificar al usuario autenticado.",
        severity: "error",
      });
      return;
    }

    try {
      await crearCita({
        paciente_id: pacienteId,
        doctor_id: selectedDoctor.id,
        disponibilidad_id: selectedSlot.disponibilidadId,
        creada_por_usuario_id: perfil.id,
        fecha_hora_inicio_agendada: selectedSlot.fechaHoraInicio,
        fecha_hora_fin_agendada: selectedSlot.fechaHoraFin,
      });

      setSnackbar({
        open: true,
        message: "Cita agendada correctamente.",
        severity: "success",
      });

      setSelectedSlotId(null);
      setRefreshCitasCounter((prev) => prev + 1);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "No se pudo agendar la cita.",
        severity: "error",
      });
    }
  };

  const selectedDoctorNombre = getDoctorNombre(selectedDoctor?.persona);
  const selectedDoctorEspecialidad = selectedDoctor?.especialidad_principal || "Sin especialidad";
  const selectedDoctorEmail = selectedDoctor?.persona?.email || "Sin correo";
  const selectedDoctorIniciales = useMemo(() => {
    if (!selectedDoctorNombre) return "";
    return selectedDoctorNombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() ?? "")
      .join("");
  }, [selectedDoctorNombre]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box
        sx={{
          p: { xs: 2, md: 4 },
          width: "100%",
          minHeight: "calc(100vh - 100px)",
          boxSizing: "border-box",
        }}
      >
        <Stack spacing={3} sx={{ maxWidth: 1400, mx: "auto" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate("/admin/agendar")}
              sx={{ borderRadius: 999 }}
            >
              Volver a agenda
            </Button>
            <Typography variant="h5" fontWeight={700} component="h1">
              Selecciona doctor y horario
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
              gap: { xs: 3, md: 4 },
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 4,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                backgroundImage:
                  theme.palette.mode === "light"
                    ? "linear-gradient(135deg, rgba(67,119,254,0.05), rgba(255,255,255,0.92))"
                    : "linear-gradient(135deg, rgba(67,119,254,0.18), rgba(28,28,28,0.92))",
              }}
            >
              <Stack spacing={1.5} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }}>
                <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                  Doctores disponibles
                </Typography>
                <TextField
                  value={qInternal}
                  onChange={(event) => setQInternal(event.target.value)}
                  placeholder="Buscar por nombre o especialidad"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                  sx={{
                    width: { xs: "100%", sm: 280 },
                    "& .MuiInputBase-root": {
                      borderRadius: 999,
                      backgroundColor: theme.palette.background.paper,
                    },
                  }}
                />
              </Stack>

              <Box sx={{ width: "100%", overflowX: "auto" }}>
                <DataGrid
                  rows={filteredDoctores}
                  getRowId={(row) => row.id}
                  columns={columns}
                  disableColumnMenu
                  autoHeight
                  loading={cargandoDoctores}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                  checkboxSelection={false}
                  rowSelectionModel={[]}
                  hideFooterSelectedRowCount
                  disableRowSelectionOnClick
                  onRowClick={(params) => setSelectedDoctorId(params.id)}
                  slotProps={{ pagination: { labelRowsPerPage: "Filas por página" } }}
                  localeText={
                    dataGridEsES?.localeText ??
                    dataGridEsES?.components?.MuiDataGrid?.defaultProps?.localeText ??
                    {}
                  }
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor:
                        theme.palette.mode === "light"
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(33,33,33,0.9)",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                    "& .MuiDataGrid-cell": {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                    ...(selectedDoctorId
                      ? {
                          [`& .MuiDataGrid-row[data-id="${selectedDoctorId}"]`]: {
                            backgroundColor:
                              theme.palette.mode === "light"
                                ? "rgba(67,119,254,0.12)"
                                : "rgba(67,119,254,0.28)",
                          },
                        }
                      : {}),
                  }}
                />
              </Box>
              {!!errorDoctores && (
                <Typography variant="body2" color="error">
                  {errorDoctores}
                </Typography>
              )}
            </Paper>

            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              <Paper
                elevation={4}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 4,
                  minHeight: 420,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                  justifyContent: "space-between",
                }}
              >
                {!selectedDoctor ? (
                  <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={600} align="center">
                      Selecciona un doctor para ver sus horarios disponibles
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Puedes utilizar el buscador para filtrar por nombre o especialidad.
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={3} sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          backgroundColor: "primary.main",
                          color: "primary.contrastText",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "1.5rem",
                        }}
                      >
                        {selectedDoctorIniciales || "DR"}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {selectedDoctorNombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedDoctorEspecialidad}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedDoctorEmail}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Selecciona una fecha
                      </Typography>
                      <DateCalendar
                        value={fechaSeleccionada}
                        onChange={(value) => {
                          if (value) setFechaSeleccionada(value.startOf("day"));
                        }}
                        minDate={today}
                        maxDate={maxDate}
                        disablePast
                        sx={{
                          borderRadius: 3,
                          border: `1px solid ${theme.palette.divider}`,
                          backgroundColor: theme.palette.background.paper,
                          p: 1,
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Horarios disponibles
                      </Typography>
                      {cargandoSlots ? (
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <CircularProgress size={20} />
                          <Typography variant="body2" color="text.secondary">
                            Cargando horarios...
                          </Typography>
                        </Stack>
                      ) : errorSlots ? (
                        <Typography variant="body2" color="error">
                          {errorSlots}
                        </Typography>
                      ) : slotsDelDia.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Sin disponibilidad configurada para esta fecha.
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "repeat(auto-fit, minmax(140px, 1fr))",
                              sm: "repeat(auto-fit, minmax(150px, 1fr))",
                            },
                            gap: 1,
                          }}
                        >
                          {slotsDelDia.map((slot) => {
                            const inicio = dayjs(slot.fechaHoraInicio).format("HH:mm");
                            const fin = dayjs(slot.fechaHoraFin).format("HH:mm");
                            const isSelected = selectedSlotId === slot.id;
                            const isOcupado = slot.estado === "ocupado";
                            return (
                              <Button
                                key={slot.id}
                                variant={isSelected ? "contained" : "outlined"}
                                color={isOcupado ? "inherit" : "primary"}
                                disabled={isOcupado}
                                onClick={() => {
                                  if (!isOcupado) {
                                    setSelectedSlotId(slot.id);
                                  }
                                }}
                                sx={{
                                  justifyContent: "center",
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  py: 1,
                                  px: 1.5,
                                  textTransform: "none",
                                  boxShadow: isSelected
                                    ? "0 10px 24px -18px rgba(67,119,254,0.8)"
                                    : "none",
                                  opacity: isOcupado ? 0.6 : 1,
                                }}
                              >
                                {inicio} – {fin}
                              </Button>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  </Stack>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end">
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!selectedDoctor || !selectedSlot || selectedSlot?.estado !== "disponible"}
                    onClick={handleReservarSlot}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                    }}
                  >
                    Reservar
                  </Button>
                </Stack>
              </Paper>
            </motion.div>
          </Box>
        </Stack>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            elevation={6}
            variant="filled"
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ borderRadius: 3 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
