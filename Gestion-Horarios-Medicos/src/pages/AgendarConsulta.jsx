import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Switch,
  Paper,
  useTheme,
  Fade,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const pacientesEjemplo = [
  {
    id: 1,
    rut: "12.345.678-9",
    nombre: "Juan",
    apellido: "Pérez",
    correo: "juan@correo.com",
    numero: "912345678",
  },
  {
    id: 2,
    rut: "20.987.654-3",
    nombre: "Maria",
    apellido: "López",
    correo: "maria@correo.com",
    numero: "987654321",
  },
];

const columns = [
  { field: "rut", headerName: "RUT", flex: 1 },
  { field: "nombre", headerName: "Nombre", flex: 1 },
  { field: "apellido", headerName: "Apellido", flex: 1 },
  { field: "correo", headerName: "Correo", flex: 1.5 },
  { field: "numero", headerName: "Teléfono", flex: 1 },
];

const AgendarConsulta = () => {
  const [showTabla, setShowTabla] = useState(true);
  const theme = useTheme();

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Paper
        elevation={3}
        sx={{
          mb: 3,
          p: 2,
          bgcolor: theme.palette.background.paper,
          borderRadius: 3,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Buscar paciente
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Nuevo Paciente
            </Typography>
            <Switch
              checked={!showTabla}
              onChange={() => setShowTabla((v) => !v)}
              color="primary"
            />
          </Box>
        </Box>
        {/* Tabla o Formulario */}
        <Fade in={showTabla} unmountOnExit>
          <Box sx={{ mt: 3, minHeight: 300 }}>
            <DataGrid
              rows={pacientesEjemplo}
              columns={columns}
              autoHeight
              disableSelectionOnClick
              sx={{
                bgcolor: theme.palette.background.default,
                borderRadius: 2,
                "& .MuiDataGrid-row:hover": {
                  bgcolor: theme.palette.action.hover,
                },
              }}
              pageSize={5}
              rowsPerPageOptions={[5]}
            />
          </Box>
        </Fade>
        <Fade in={!showTabla} unmountOnExit>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Formulario para ingresar paciente nuevo
            </Typography>
            {/* Aquí pon tu formulario de paciente */}
            <form>
              <Box display="flex" flexDirection="column" gap={2}>
                <input placeholder="RUT" />
                <input placeholder="Nombre" />
                <input placeholder="Apellido" />
                <input placeholder="Correo" />
                <input placeholder="Número" />
                <Button variant="contained" color="primary">
                  Registrar paciente
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Paper>
    </Box>
  );
};

export default AgendarConsulta;
