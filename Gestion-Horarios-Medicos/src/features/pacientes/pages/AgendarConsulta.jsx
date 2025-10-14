import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  TextField,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { DataGrid } from "@mui/x-data-grid";
import { esES as dataGridEsES } from "@mui/x-data-grid/locales";
import RegistroPacienteDialog from "@/features/pacientes/components/RegistroPacienteDialog.jsx";
import { tokenize, matchAllTokens, highlightRenderer } from "@/utils/search";
import { listarPacientes } from "@/services/pacientes";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function AgendarConsulta() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // búsqueda con debounce
  const [query, setQuery] = useState("");
  const [qInternal, setQInternal] = useState("");
  const debounceRef = useRef(null);
  const onChangeQuery = (e) => {
    const val = e.target.value;
    setQInternal(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val), 220);
  };

  // diálogos
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPacienteCheck, setOpenPacienteCheck] = useState(false);
  const [openRegistroPaciente, setOpenRegistroPaciente] = useState(false);
  const idCounter = useRef(1);
  const [selectedPacienteId, setSelectedPacienteId] = useState(null);

  // handlers únicos
  const handleNuevoClick = () => setOpenConfirm(true);
  const handleConfirmCancel = () => setOpenConfirm(false);
  const handleConfirmContinue = () => {
    setOpenConfirm(false);
    setOpenPacienteCheck(true);
  };
  const handlePacienteRegistrado = () => setOpenPacienteCheck(false);
  const handlePacienteNoRegistrado = () => {
    setOpenPacienteCheck(false);
    setOpenRegistroPaciente(true);
  };
  const handleCloseRegistroPaciente = () => setOpenRegistroPaciente(false);
  const handleRegistroSuccess = (nuevoPaciente) => {
    setPacientes((prev) => {
      const assignedId = nuevoPaciente?.id ?? idCounter.current++;
      return [{ id: assignedId, ...nuevoPaciente }, ...prev];
    });
    setOpenRegistroPaciente(false);
    setOpenPacienteCheck(false);
  };

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setCargando(true);
        const rows = await listarPacientes();
        if (!cancel) setPacientes(rows);
      } catch (e) {
        if (!cancel) setError(e.message || "Error al cargar pacientes");
      } finally {
        if (!cancel) setCargando(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    const maxId = pacientes.reduce((max, paciente) => {
      const numeric = typeof paciente.id === "number" ? paciente.id : Number.parseInt(paciente.id, 10);
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    idCounter.current = maxId + 1;
  }, [pacientes]);

  // filtrado client-side
  const tokens = useMemo(() => tokenize(query), [query]);
  const filtered = useMemo(() => {
    if (tokens.length === 0) return pacientes;
    return pacientes.filter((p) =>
      matchAllTokens(
        `${p.rut} ${p.nombre} ${p.apellido} ${p.correo} ${p.numero}`,
        tokens
      )
    );
  }, [pacientes, tokens]);

  const selectedPaciente = useMemo(
    () => pacientes.find((p) => p.id === selectedPacienteId) || null,
    [pacientes, selectedPacienteId]
  );

  // highlight renderers
  const h = highlightRenderer(query);
  const columns = useMemo(
    () => [
      {
        field: "rut",
        headerName: "RUT",
        flex: 0.8,
        minWidth: 160,
        renderCell: ({ value }) => h(value),
      },
      {
        field: "nombre",
        headerName: "Nombre",
        flex: 1,
        minWidth: 140,
        renderCell: ({ value }) => h(value),
      },
      {
        field: "apellido",
        headerName: "Apellido",
        flex: 1,
        minWidth: 150,
        renderCell: ({ value }) => h(value),
      },
      {
        field: "correo",
        headerName: "Correo",
        flex: 1.3,
        minWidth: 220,
        renderCell: ({ value }) => h(value),
      },
      {
        field: "numero",
        headerName: "Teléfono",
        flex: 1,
        minWidth: 170,
        renderCell: ({ value }) => h(value),
      },
    ],
    [query]
  );

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        minHeight: "calc(100vh - 100px)",
        gap: 3,
        pb: 4,
      }}
    >
      <Fade in timeout={400}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 4,
            width: "100%",
            maxWidth: { xs: "100%", lg: 1100 },
            backgroundImage:
              theme.palette.mode === "light"
                ? "linear-gradient(135deg, rgba(67,119,254,0.08), rgba(255,255,255,0.9))"
                : "linear-gradient(135deg, rgba(67,119,254,0.18), rgba(33,33,33,0.9))",
            boxShadow:
              theme.palette.mode === "light"
                ? "0 20px 45px -24px rgba(15,23,42,0.35)"
                : "0 22px 45px -24px rgba(15,23,42,0.65)",
            transition: "all 0.4s ease",
          }}
        >
          {/* Encabezado + buscador */}
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            gap={2}
            sx={{ pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
                Gestión de agenda clínica
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Localice pacientes registrados o incorpore nuevos en segundos
                para continuar con el proceso de agendamiento.
              </Typography>
            </Box>

            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                gap: 1.5,
              }}
            >
              <TextField
                value={qInternal}
                onChange={onChangeQuery}
                placeholder="Buscar por RUT, nombre, apellido, correo o teléfono"
                size="medium"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: "100%", md: 320 },
                  "& .MuiInputBase-root": {
                    borderRadius: 999,
                    backgroundColor: theme.palette.background.paper,
                    transition: "box-shadow 0.25s ease",
                  },
                  "& .MuiOutlinedInput-notchedOutline": { borderWidth: 0 },
                  "& .MuiInputBase-root:hover": {
                    boxShadow: "0 0 0 3px rgba(67,119,254,0.12)",
                  },
                  "& .Mui-focused": {
                    boxShadow: "0 0 0 4px rgba(67,119,254,0.18)",
                  },
                }}
              />

              {selectedPaciente && (
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.02, boxShadow: "0 12px 24px -12px rgba(67,119,254,0.55)" }}
                  whileTap={{ scale: 0.98 }}
                  variant="contained"
                  color="primary"
                  onClick={() =>
                    navigate("/admin/agendar/seleccionar-horario", {
                      state: {
                        pacienteId: selectedPaciente.id,
                        pacienteEmail: selectedPaciente.correo || "",
                      },
                    })
                  }
                  sx={{
                    borderRadius: "14px",
                    px: 3,
                    py: 1,
                    alignSelf: { xs: "stretch", sm: "auto" },
                    boxShadow: "0 10px 22px -14px rgba(67,119,254,0.5)",
                    transition: "box-shadow 0.25s ease",
                  }}
                >
                  Siguiente: seleccionar horario
                </Button>
              )}
            </Box>
          </Box>

          {/* Tabla */}
          <Fade in timeout={500}>
            <Box sx={{ mt: 2, width: "100%", overflowX: "auto" }}>
              <DataGrid
                rows={filtered}
                columns={columns}
                getRowId={(r) => r.id}
                disableColumnMenu
                autoHeight
                pageSizeOptions={[5, 10, 25]}
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                loading={cargando}
                checkboxSelection
                rowSelectionModel={[]}
                hideFooterSelectedRowCount
                disableRowSelectionOnClick
                onRowSelectionModelChange={() => {}}
                onRowClick={(params) => {
                  setSelectedPacienteId(params.id);
                }}
                slotProps={{ pagination: { labelRowsPerPage: "Filas por página" } }}
                sx={{
                  mt: 1,
                  borderRadius: 3,
                  width: "100%",
                  minWidth: { xs: "100%", md: 560 },
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  "& .MuiDataGrid-cellCheckbox, & .MuiDataGrid-columnHeaderCheckbox": {
                    display: "none",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    backgroundColor:
                      theme.palette.mode === "light"
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(30,30,30,0.9)",
                    backdropFilter: "blur(6px)",
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    transition: "background-color 0.3s ease",
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor:
                      theme.palette.mode === "light"
                        ? "rgba(67,119,254,0.06)"
                        : "rgba(67,119,254,0.18)",
                  },
                  ...(selectedPacienteId
                    ? {
                        [`& .MuiDataGrid-row[data-id="${selectedPacienteId}"]`]: {
                          backgroundColor:
                            theme.palette.mode === "light"
                              ? "rgba(67,119,254,0.12)"
                              : "rgba(67,119,254,0.28)",
                        },
                      }
                    : {}),
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: `1px solid ${theme.palette.divider}`,
                  },
                  "& mark": {
                    backgroundColor:
                      theme.palette.mode === "light"
                        ? "rgba(67,119,254,0.25)"
                        : "rgba(67,119,254,0.35)",
                    color: "inherit",
                    padding: "0 2px",
                    borderRadius: "4px",
                  },
                }}
                localeText={
                  dataGridEsES?.localeText ??
                  dataGridEsES?.components?.MuiDataGrid?.defaultProps?.localeText ??
                  {}
                }
              />
              {!!error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>
          </Fade>

          {!!error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          {/* CTA: nuevo */}
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              variant="contained"
              size="large"
              onClick={handleNuevoClick}
              sx={{
                borderRadius: "14px",
                px: 3.5,
                py: 1,
                boxShadow: "0 12px 24px -12px rgba(67,119,254,0.45)",
              }}
            >
              Nuevo
            </Button>
          </Box>
        </Paper>
      </Fade>

      {/* Confirmar inicio */}
      <Dialog open={openConfirm} onClose={handleConfirmCancel}>
        <DialogTitle>Confirmar inicio</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Desea iniciar el proceso de agendamiento de una consulta?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmCancel}>Cancelar</Button>
          <Button onClick={handleConfirmContinue} autoFocus>
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ¿Paciente registrado? */}
      <Dialog
        open={openPacienteCheck}
        onClose={() => setOpenPacienteCheck(false)}
      >
        <DialogTitle>¿El paciente está registrado?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Antes de agendar, confirma si el paciente ya está inscrito en la
            base de datos.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePacienteNoRegistrado}>No</Button>
          <Button onClick={handlePacienteRegistrado} autoFocus>
            Sí
          </Button>
        </DialogActions>
      </Dialog>

      {/* Registro paciente */}
      <RegistroPacienteDialog
        open={openRegistroPaciente}
        onClose={handleCloseRegistroPaciente}
        onSuccess={handleRegistroSuccess}
      />
    </Box>
  );
}
