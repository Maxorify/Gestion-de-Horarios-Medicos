import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { esES as dataGridEsES } from "@mui/x-data-grid/locales";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { listarDoctores } from "@/services/doctores.js";
import { requireRole } from "@/services/authLocal";
import NuevoDoctorDialog from "@/features/doctores/components/NuevoDoctorDialog.jsx";

const DEBOUNCE_TIME = 220;

export default function DoctoresAdmin() {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openNuevo, setOpenNuevo] = useState(false);
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
      const currentFetchId = fetchIdRef.current;
      setLoading(true);
      setError("");
      try {
        const data = await listarDoctores();
        const filtered = currentSearch
          ? data.filter((item) => {
              const term = currentSearch.toLowerCase();
              const nombre = item.nombre?.toLowerCase() ?? "";
              const email = item.email?.toLowerCase() ?? "";
              const rut = item.persona?.rut?.toLowerCase() ?? "";
              const especialidad = item.especialidades?.toLowerCase() ?? "";
              return (
                nombre.includes(term) ||
                email.includes(term) ||
                rut.includes(term) ||
                especialidad.includes(term)
              );
            })
          : data;
        if (fetchIdRef.current === currentFetchId) {
          setRows(filtered);
        }
      } catch (err) {
        if (fetchIdRef.current === currentFetchId) {
          setError(err?.message || "No se pudo cargar la lista de doctores.");
        }
      } finally {
        if (fetchIdRef.current === currentFetchId) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    fetchDoctores(debouncedSearch);
  }, [debouncedSearch, fetchDoctores]);

  const columns = useMemo(
    () => [
      {
        field: "nombre",
        headerName: "Nombre",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "rut",
        headerName: "RUT",
        width: 150,
        valueGetter: (p) => p.row.persona?.rut ?? "",
      },
      {
        field: "especialidades",
        headerName: "Especialidades",
        flex: 1,
        minWidth: 220,
      },
    ],
    [],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const canManage = requireRole("administrador", "secretaria");

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Gestión de doctores
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra la información y especialidades de los doctores.
          </Typography>
        </Box>
        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setOpenNuevo(true)}
            sx={{ borderRadius: 999 }}
          >
            Nuevo doctor
          </Button>
        )}
      </Stack>

      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
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
              width: { xs: "100%", sm: 320 },
              "& .MuiInputBase-root": {
                borderRadius: 999,
                backgroundColor: theme.palette.background.paper,
              },
            }}
          />
          {loading && (
            <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
              <CircularProgress size={20} />
              <Typography variant="body2">Cargando doctores…</Typography>
            </Stack>
          )}
        </Stack>

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            autoHeight
            loading={loading}
            disableColumnMenu
            disableRowSelectionOnClick
            rowSelectionModel={[]}
            hideFooterSelectedRowCount
            pageSizeOptions={[5, 10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
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
            }}
          />
        </Box>
        {!!error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </Paper>

      <NuevoDoctorDialog
        open={openNuevo}
        onClose={() => setOpenNuevo(false)}
        onCreated={(resultado) => {
          setOpenNuevo(false);
          const passwordInfo = resultado?.passwordTemporal
            ? ` Contraseña temporal: ${resultado.passwordTemporal}`
            : "";
          setSnackbar({ open: true, message: `Doctor creado.${passwordInfo}`, severity: "success" });
          fetchDoctores(debouncedSearch);
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
