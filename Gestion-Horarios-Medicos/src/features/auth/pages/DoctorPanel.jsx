import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import { SidebarDoctor } from "@/components/SidebarDoctor";
import Topbar from "@/components/Topbar";
import { useUser } from "@/hooks/useUser";
import { listarCitasDoctorConfirmadas } from "@/services/citas";
import { Box, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { tokens } from "@/theme";

function DoctorDashboardContent() {
  const { user } = useUser();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";
  const surface = isDark ? colors.primary[600] : colors.primary[100];
  const borderColor = isDark ? colors.primary[700] : colors.grey[300];
  const headingColor = isDark ? colors.grey[100] : colors.grey[900];
  const textMuted = isDark ? colors.grey[300] : colors.grey[600];
  const shadow = isDark
    ? `0 12px 30px ${alpha(colors.primary[900], 0.55)}`
    : `0 12px 28px ${alpha(colors.grey[900], 0.08)}`;

  useEffect(() => {
    let cancel = false;

    (async () => {
      if (!user?.doctor_id) {
        if (!cancel) {
          setCitas([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      const desdeISO = new Date("2000-01-01T00:00:00.000Z").toISOString();
      const hastaISO = new Date("2100-01-01T00:00:00.000Z").toISOString();

      try {
        const data = await listarCitasDoctorConfirmadas({
          doctorId: user.doctor_id,
          desdeISO,
          hastaISO,
        });

        if (!cancel) {
          const rows = (Array.isArray(data) ? data : []).map((row) => ({
            ...row,
            cita_id: row.cita_id ?? row.id ?? row.citaId ?? row.citaID ?? null,
            paciente_nombre:
              row.paciente_nombre ??
              row.nombre_paciente ??
              row.pacienteNombre ??
              row.nombre ??
              "Paciente sin nombre",
            fecha_hora_inicio_agendada:
              row.fecha_hora_inicio_agendada ??
              row.fecha_inicio ??
              row.inicio ??
              row.fechaHoraInicio ??
              null,
            fecha_hora_fin_agendada:
              row.fecha_hora_fin_agendada ??
              row.fecha_fin ??
              row.fin ??
              row.fechaHoraFin ??
              null,
            paciente_rut: row.paciente_rut ?? row.rut ?? row.pacienteRut ?? null,
          }));
          setCitas(rows);
        }
      } catch (e) {
        if (!cancel) {
          console.error("Error listando confirmadas:", e);
          setError(e?.message ?? "No se pudieron cargar las citas confirmadas.");
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [user?.doctor_id]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h4" sx={{ color: headingColor }}>
        Citas confirmadas
      </Typography>
      {loading && (
        <Typography variant="body2" sx={{ color: textMuted }}>
          Cargando citas...
        </Typography>
      )}
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
      {!loading && !error && (
        <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {citas.length === 0 ? (
            <Typography component="li" variant="body2" sx={{ color: textMuted }}>
              No hay citas confirmadas en el rango seleccionado.
            </Typography>
          ) : (
            citas.map((cita) => (
              <Box
                key={cita.cita_id ?? `${cita.paciente_nombre}-${cita.fecha_hora_inicio_agendada}`}
                component="li"
                sx={{
                  backgroundColor: surface,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  px: 3,
                  py: 2.5,
                  boxShadow: shadow,
                }}
              >
                <Typography variant="subtitle1" sx={{ color: headingColor, fontWeight: 600 }}>
                  {cita.paciente_nombre || "Paciente sin nombre"}
                </Typography>
                <Typography variant="body2" sx={{ color: textMuted }}>
                  {dayjs(cita.fecha_hora_inicio_agendada).format("DD/MM/YYYY HH:mm")} - {" "}
                  {dayjs(cita.fecha_hora_fin_agendada).format("HH:mm")}
                </Typography>
                {cita.paciente_rut && (
                  <Typography variant="body2" sx={{ color: textMuted }}>
                    RUT: {cita.paciente_rut}
                  </Typography>
                )}
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}

export default function DoctorPanel() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const layoutBg = theme.palette.mode === "dark" ? colors.primary[700] : colors.primary[50] ?? "#f5f8ff";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", backgroundColor: layoutBg }}>
      <SidebarDoctor />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 1000 }}>
          <Topbar />
        </Box>
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          <DoctorDashboardContent />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
