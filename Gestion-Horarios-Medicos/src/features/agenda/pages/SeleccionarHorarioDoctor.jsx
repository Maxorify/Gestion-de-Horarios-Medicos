import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
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
import { listarSlotsDoctor, reservarSlot } from "@/services/horarios";

dayjs.extend(customParseFormat);

const panelVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export default function SeleccionarHorarioDoctor() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { pacienteId, pacienteEmail } = location.state || {};

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
    [doctores, selectedDoctorId]
  );

  const today = useMemo(() => dayjs().startOf("day"), []);
  const maxDate = useMemo(() => today.add(13, "day"), [today]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => dayjs().startOf("day"));

  const [slots, setSlots] = useState([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState("");
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
        const rows = await listarDoctores({ search: query });
        if (!cancel) {
          setDoctores(rows);
          if (rows.every((row) => row.id !== selectedDoctorId)) {
            setSelectedDoctorId(null);
          }
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
  }, [query, selectedDoctorId]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setSlots([]);
      setSelectedSlotId(null);
      return;
    }

    let cancel = false;
    const fetchSlots = async () => {
      try {
        setCargandoSlots(true);
        setErrorSlots("");
        const fecha = fechaSeleccionada.startOf("day").format("YYYY-MM-DD");
        const data = await listarSlotsDoctor({ doctorId: selectedDoctorId, desde: fecha, dias: 1 });
        if (!cancel) {
          setSlots(data);
          setSelectedSlotId(null);
        }
      } catch (error) {
        if (!cancel) {
          setErrorSlots(error.message || "No se pudieron cargar los horarios disponibles");
        }
      } finally {
        if (!cancel) setCargandoSlots(false);
      }
    };

    fetchSlots();

    return () => {
      cancel = true;
    };
  }, [fechaSeleccionada, selectedDoctorId]);

  const fechaSeleccionadaStr = useMemo(
    () => fechaSeleccionada.startOf("day").format("YYYY-MM-DD"),
    [fechaSeleccionada]
  );

  const slotsDelDia = useMemo(
    () => slots.filter((slot) => slot.fecha === fechaSeleccionadaStr),
    [slots, fechaSeleccionadaStr]
  );

  const columns = useMemo(
    () => [
      { field: "nombre", headerName: "Nombre", flex: 1, minWidth: 180 },
      {
        field: "especialidades",
        headerName: "Especialidades",
        flex: 1.2,
        minWidth: 220,
        renderCell: ({ value }) => value || "—",
      },
      { field: "email", headerName: "Correo", flex: 1, minWidth: 210 },
    ],
    []
  );

  const handleReservar = async () => {
    if (!selectedSlotId || !selectedDoctor || !pacienteId) return;
    try {
      const result = await reservarSlot({
        pacienteId,
        horarioId: selectedSlotId,
        email: pacienteEmail || "",
      });

      if (result !== "OK") {
        throw new Error(typeof result === "string" ? result : "No se pudo reservar");
      }

      setSnackbar({ open: true, message: "Reserva creada", severity: "success" });
      const fecha = fechaSeleccionada.startOf("day").format("YYYY-MM-DD");
      const data = await listarSlotsDoctor({ doctorId: selectedDoctor.id, desde: fecha, dias: 1 });
      setSlots(data);
      setSelectedSlotId(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "No se pudo reservar",
        severity: "error",
      });
    }
  };

  const avatarUrl = selectedDoctor
    ? selectedDoctor.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${selectedDoctor.id}`
    : "";

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
                  placeholder="Buscar por nombre"
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
                  rows={doctores}
                  getRowId={(row) => row.id}
                  columns={columns}
                  disableColumnMenu
                  autoHeight
                  loading={cargandoDoctores}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                  rowSelectionModel={selectedDoctorId ? [selectedDoctorId] : []}
                  onRowSelectionModelChange={(selection) => {
                    const value = Array.isArray(selection) && selection.length > 0 ? selection[0] : null;
                    setSelectedDoctorId(value);
                  }}
                  onRowClick={(params) => setSelectedDoctorId(params.id)}
                  slotProps={{ pagination: { labelRowsPerPage: "Filas por página" } }}
                  localeText={{
                    ...(dataGridEsES.components?.MuiDataGrid?.defaultProps?.localeText || {}),
                    noRowsLabel: cargandoDoctores ? "Cargando doctores..." : "Sin doctores",
                    noResultsOverlayLabel: "Sin resultados",
                  }}
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
                      Puedes utilizar el buscador para filtrar por nombre.
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={3} sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar src={avatarUrl} alt={selectedDoctor.nombre} sx={{ width: 64, height: 64 }} />
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {selectedDoctor.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedDoctor.especialidades || "Sin especialidades registradas"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedDoctor.email || "Sin correo"}
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
                          Sin horarios disponibles en esta fecha
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "repeat(auto-fit, minmax(120px, 1fr))",
                              sm: "repeat(auto-fit, minmax(130px, 1fr))",
                            },
                            gap: 1,
                          }}
                        >
                          {slotsDelDia.map((slot) => {
                            const inicio = dayjs(slot.hora_inicio, "HH:mm:ss").format("HH:mm");
                            const fin = slot.hora_fin
                              ? dayjs(slot.hora_fin, "HH:mm:ss").format("HH:mm")
                              : null;
                            return (
                              <Chip
                                key={slot.id}
                                label={fin ? `${inicio} – ${fin}` : inicio}
                                clickable
                                color={selectedSlotId === slot.id ? "primary" : "default"}
                                onClick={() => setSelectedSlotId(slot.id)}
                                sx={{
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  boxShadow:
                                    selectedSlotId === slot.id
                                      ? "0 10px 24px -18px rgba(67,119,254,0.8)"
                                      : "none",
                                }}
                              />
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
                    disabled={!selectedDoctor || !selectedSlotId}
                    onClick={handleReservar}
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

