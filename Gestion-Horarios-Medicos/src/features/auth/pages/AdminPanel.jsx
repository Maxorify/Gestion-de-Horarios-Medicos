// src/features/auth/pages/AdminPanel.jsx
import { useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

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

  return (
    <div
      style={{
        padding: "2rem",
        color: theme.palette.text.primary,
        transition: "color 0.3s ease",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Bienvenido Admin
      </h1>
      <p style={{ lineHeight: 1.6 }}>
        Este es tu panel principal. Desde aquí vas a poder revisar doctores,
        asignar horarios, generar reportes y gestionar todo el sistema de la
        clínica.
      </p>

      <div
        style={{
          marginTop: "2rem",
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        <div
          style={{
            backgroundColor: surface,
            padding: "1.5rem",
            borderRadius: "12px",
            border: `1px solid ${borderColor}`,
            boxShadow: subtleShadow,
            color: theme.palette.text.primary,
            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
            backdropFilter: "blur(4px)",
            outline: `1px solid ${alpha(borderColor, 0.35)}`,
            outlineOffset: -1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${alpha(accent, 0.12)} 0%, transparent 65%)`,
              pointerEvents: "none",
            }}
          />
          <h3>Resumen</h3>
          <p>Usuarios activos: 1,234</p>
          <p>Sesiones hoy: 567</p>
          <p>Rendimiento: 98.5%</p>
        </div>

        <div
          style={{
            backgroundColor: surface,
            padding: "1.5rem",
            borderRadius: "12px",
            border: `1px solid ${borderColor}`,
            boxShadow: subtleShadow,
            color: theme.palette.text.primary,
            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
            backdropFilter: "blur(4px)",
            outline: `1px solid ${alpha(borderColor, 0.35)}`,
            outlineOffset: -1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${alpha(accent, 0.1)} 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <h3>Acciones rápidas</h3>
          <p style={{ color: mutedText }}>
            Podés configurar doctores, horarios y reportes desde el menú.
          </p>
        </div>
      </div>
    </div>
  );
}
