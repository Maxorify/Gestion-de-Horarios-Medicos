import React, { useMemo, useRef, useState } from "react";
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
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { DataGrid, GridToolbarQuickFilter } from "@mui/x-data-grid";
import RegistroPacienteDialog from "@/features/pacientes/components/RegistroPacienteDialog.jsx";

const pacientesEjemplo = [
  {
    id: 1,
    rut: "12.345.678-9",
    nombre: "Juan",
    apellido: "Pérez",
    correo: "juan@correo.com",
    numero: "+56912345678",
  },
  {
    id: 2,
    rut: "20.987.654-3",
    nombre: "María",
    apellido: "López",
    correo: "maria@correo.com",
    numero: "+56987654321",
  },
];

const columns = [
  { field: "rut", headerName: "RUT", flex: 0.8, minWidth: 160 },
  { field: "nombre", headerName: "Nombre", flex: 1, minWidth: 140 },
  { field: "apellido", headerName: "Apellido", flex: 1, minWidth: 150 },
  { field: "correo", headerName: "Correo", flex: 1.3, minWidth: 220 },
  { field: "numero", headerName: "Teléfono", flex: 1, minWidth: 170 },
];

const QuickSearchToolbar = ({ quickFilterProps }) => (
  <Box
    sx={{
      px: 2,
      py: 1.5,
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 1.5,
      flexWrap: "wrap",
    }}
  >
    <GridToolbarQuickFilter
      {...quickFilterProps}
      debounceMs={300}
      variant="outlined"
      size="small"
      placeholder="Buscar por RUT, nombre, apellido o correo"
      quickFilterParser={(value) =>
        value
          .split(/\s+/)
          .filter((word) => word.length > 0)
          .slice(0, 6)
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
        sx: {
          borderRadius: 999,
          transition: "box-shadow 0.3s ease",
          "&:hover": {
            boxShadow: "0 0 0 3px rgba(67,119,254,0.15)",
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 4px rgba(67,119,254,0.18)",
          },
        },
      }}
      sx={{
        width: { xs: "100%", sm: 360 },
        "& .MuiOutlinedInput-notchedOutline": {
          borderWidth: 0,
        },
        "& .MuiInputBase-root": {
          borderRadius: 999,
          backgroundColor: (theme) => theme.palette.background.paper,
        },
      }}
    />
  </Box>
);

const AgendarConsulta = () => {
  const theme = useTheme();
  const [pacientes, setPacientes] = useState(pacientesEjemplo);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPacienteCheck, setOpenPacienteCheck] = useState(false);
  const [openRegistroPaciente, setOpenRegistroPaciente] = useState(false);
  const idCounter = useRef(pacientesEjemplo.length + 1);

  const handleNuevoClick = () => setOpenConfirm(true);
  const handleConfirmCancel = () => setOpenConfirm(false);
  const handleConfirmContinue = () => {
    setOpenConfirm(false);
    setOpenPacienteCheck(true);
  };
  const handlePacienteRegistrado = () => {
    setOpenPacienteCheck(false);
  };
  const handlePacienteNoRegistrado = () => {
    setOpenPacienteCheck(false);
    setOpenRegistroPaciente(true);
  };
  const handleCloseRegistroPaciente = () => {
    setOpenRegistroPaciente(false);
  };
  const handleRegistroSuccess = (nuevoPaciente) => {
    setPacientes((prev) => [
      { id: idCounter.current++, ...nuevoPaciente },
      ...prev,
    ]);
    setOpenRegistroPaciente(false);
    setOpenPacienteCheck(false);
  };

  const rows = useMemo(() => pacientes, [pacientes]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, display: "grid", gap: 3 }}>
      <Fade in timeout={400}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 4,
            backgroundImage: theme.palette.mode === "light"
              ? "linear-gradient(135deg, rgba(67,119,254,0.08), rgba(255,255,255,0.9))"
              : "linear-gradient(135deg, rgba(67,119,254,0.18), rgba(33,33,33,0.9))",
            boxShadow:
              theme.palette.mode === "light"
                ? "0 20px 45px -24px rgba(15,23,42,0.35)"
                : "0 22px 45px -24px rgba(15,23,42,0.65)",
            transition: "all 0.4s ease",
          }}
        >
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

          <Fade in timeout={500}>
            <Box sx={{ mt: 2 }}>
              <DataGrid
                rows={rows}
                columns={columns}
                disableColumnMenu
                disableRowSelectionOnClick
                autoHeight
                pageSizeOptions={[5, 10]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5 } },
                }}
                slots={{ toolbar: QuickSearchToolbar }}
                slotProps={{
                  toolbar: {
                    quickFilterProps: { debounceMs: 300 },
                  },
                }}
                sx={{
                  mt: 1,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
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
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: `1px solid ${theme.palette.divider}`,
                  },
                }}
              />
            </Box>
          </Fade>
        </Paper>
      </Fade>

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

      <Dialog open={openPacienteCheck} onClose={() => setOpenPacienteCheck(false)}>
        <DialogTitle>¿El paciente está registrado?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Antes de agendar, confirma si el paciente ya está inscrito en la base
            de datos.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePacienteNoRegistrado}>No</Button>
          <Button onClick={handlePacienteRegistrado} autoFocus>
            Sí
          </Button>
        </DialogActions>
      </Dialog>

      <RegistroPacienteDialog
        open={openRegistroPaciente}
        onClose={handleCloseRegistroPaciente}
        onSuccess={handleRegistroSuccess}
      />
    </Box>
  );
};

export default AgendarConsulta;
