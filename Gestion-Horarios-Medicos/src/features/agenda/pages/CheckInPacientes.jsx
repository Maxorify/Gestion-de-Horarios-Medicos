import { useEffect, useMemo, useState } from "react";
import { Box, Button, Paper, Stack, Typography, Snackbar, Alert } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useUser } from "@/hooks/useUser";
import { listarCitasParaCheckin, checkinPaciente, anularCita, confirmarCitaSimple } from "@/services/citas";
import { toUtcISO, ZONA_HORARIA_CHILE } from "@/utils/fechaLocal";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function CheckInPacientes() {
  const { user } = useUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const inicio = useMemo(() => dayjs().tz(ZONA_HORARIA_CHILE).startOf("day"), []);
  const fin = useMemo(() => dayjs().tz(ZONA_HORARIA_CHILE).endOf("day"), []);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listarCitasParaCheckin({
        desdeISO: toUtcISO(inicio.toDate()),
        hastaISO: toUtcISO(fin.toDate()),
        doctorId: null,
        estados: ["programada", "pendiente"],
        search: null
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setSnack({ open: true, message: e?.message || "Error listando citas", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const cols = [
    {
      field: "hora",
      headerName: "Hora",
      flex: 0.6,
      minWidth: 100,
      valueGetter: ({ row }) => dayjs(row.fecha_hora_inicio_agendada).tz(ZONA_HORARIA_CHILE).format("HH:mm"),
    },
    { field: "paciente_nombre", headerName: "Paciente", flex: 1.2, minWidth: 200 },
    { field: "paciente_rut", headerName: "RUT", flex: 0.8, minWidth: 140 },
    { field: "doctor_nombre", headerName: "Doctor", flex: 1.2, minWidth: 200 },
    { field: "estado", headerName: "Estado", flex: 0.7, minWidth: 120 },
    {
      field: "actions", headerName: "Acciones", sortable: false, flex: 1.4, minWidth: 340,
      renderCell: ({ row }) => {
        const citaId = row.cita_id || row.id;
        return (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={async () => {
              try {
                await checkinPaciente({ citaId });
                setSnack({ open: true, message: "Llegada registrada", severity: "success" });
                refresh();
              } catch (e) {
                setSnack({ open: true, message: e?.message || "Error en check-in", severity: "error" });
              }
            }}>Check-in</Button>
            <Button size="small" color="error" variant="outlined" onClick={async () => {
              try {
                await anularCita({ citaId, motivo: "anulación demo" });
                setSnack({ open: true, message: "Cita anulada", severity: "success" });
                refresh();
              } catch (e) {
                setSnack({ open: true, message: e?.message || "Error al anular", severity: "error" });
              }
            }}>Anular</Button>
            <Button size="small" color="primary" variant="contained" onClick={async () => {
              try {
                if (!user?.usuario_id_legacy) throw new Error("Usuario no identificado");
                await confirmarCitaSimple({
                  citaId,
                  usuarioIdLegacy: user.usuario_id_legacy,
                  monto: 0,
                  metodo: null,
                  obs: "confirmación demo"
                });
                setSnack({ open: true, message: "Cita confirmada", severity: "success" });
                refresh();
              } catch (e) {
                setSnack({ open: true, message: e?.message || "Error al confirmar", severity: "error" });
              }
            }}>Confirmar pago</Button>
          </Stack>
        );
      }
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Check-in pacientes</Typography>
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <div style={{ width: "100%" }}>
          <DataGrid
            autoHeight
            rows={(rows || []).map((r, i) => ({ id: r.cita_id || r.id || i, ...r }))}
            columns={cols}
            loading={loading}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
          />
        </div>
      </Paper>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
