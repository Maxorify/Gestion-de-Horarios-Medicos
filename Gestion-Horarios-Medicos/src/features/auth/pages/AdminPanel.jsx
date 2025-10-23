// src/features/auth/pages/AdminPanel.jsx
import { Box, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { tokens } from "@/theme";

export default function AdminPanel() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const surface = theme.palette.background.paper;
  const borderColor = theme.palette.divider;
  const subtleShadow = isDark
    ? "0 12px 32px rgba(5, 8, 13, 0.45)"
    : "0 12px 32px rgba(15, 23, 42, 0.12)";
  const accent = theme.palette.primary.main;
  const mutedText = theme.palette.text.secondary;

  const isDark = theme.palette.mode === "dark";
  const textPrimary = isDark ? colors.grey[100] : colors.grey[900];
  const textSecondary = isDark ? colors.grey[300] : colors.grey[600];
  const surface = isDark ? colors.primary[600] : colors.primary[100];
  const surfaceBorder = isDark ? colors.primary[700] : colors.grey[300];
  const shadowColor = isDark
    ? alpha(colors.primary[900], 0.55)
    : alpha(colors.grey[900], 0.08);

  const isDark = theme.palette.mode === "dark";
  const textPrimary = isDark ? colors.grey[100] : colors.grey[900];
  const textSecondary = isDark ? colors.grey[300] : colors.grey[600];
  const surface = isDark ? colors.primary[600] : colors.primary[100];
  const surfaceBorder = isDark ? colors.primary[700] : colors.grey[300];
  const shadowColor = isDark
    ? alpha(colors.primary[900], 0.55)
    : alpha(colors.grey[900], 0.08);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 3 },
        color: textPrimary,
      }}
    >
      <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
        Bienvenido Admin
      </Typography>
      <Typography variant="body1" sx={{ lineHeight: 1.7, color: textSecondary }}>
        Este es tu panel principal. Desde aquí vas a poder revisar doctores,
        asignar horarios, generar reportes y gestionar todo el sistema de la
        clínica.
      </Typography>

      <Box
        sx={{
          mt: 4,
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        {[{
          title: "Resumen",
          items: [
            "Usuarios activos: 1,234",
            "Sesiones hoy: 567",
            "Rendimiento: 98.5%",
          ],
        },
        {
          title: "Acciones rápidas",
          items: [
            "Podés configurar doctores, horarios y reportes desde el menú.",
          ],
        }].map((card) => (
          <Box
            key={card.title}
            sx={{
              backgroundColor: surface,
              border: `1px solid ${surfaceBorder}`,
              borderRadius: 3,
              p: 3,
              boxShadow: `0 18px 45px ${shadowColor}`,
              backdropFilter: isDark ? "blur(6px)" : "none",
            }}
          >
            <Typography variant="h5" sx={{ mb: 1.5 }}>
              {card.title}
            </Typography>
            {card.items.map((item) => (
              <Typography key={item} variant="body2" sx={{ color: textSecondary }}>
                {item}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
