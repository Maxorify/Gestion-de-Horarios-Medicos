// src/features/auth/pages/AdminPanel.jsx
import { useTheme } from "@mui/material";
import { tokens } from "@/theme";

export default function AdminPanel() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <div
      style={{
        padding: "2rem",
        color: theme.palette.mode === "dark" ? colors.grey[100] : "#111",
        transition: "color 0.3s ease",
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
            backgroundColor:
              theme.palette.mode === "dark"
                ? colors.primary[500]
                : colors.grey[50],
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 2px 12px rgba(0,0,0,0.4)"
                : "0 2px 12px rgba(0,0,0,0.1)",
          }}
        >
          <h3>Resumen</h3>
          <p>Usuarios activos: 1,234</p>
          <p>Sesiones hoy: 567</p>
          <p>Rendimiento: 98.5%</p>
        </div>

        <div
          style={{
            backgroundColor:
              theme.palette.mode === "dark"
                ? colors.primary[500]
                : colors.grey[50],
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 2px 12px rgba(0,0,0,0.4)"
                : "0 2px 12px rgba(0,0,0,0.1)",
          }}
        >
          <h3>Acciones rápidas</h3>
          <p>Podés configurar doctores, horarios y reportes desde el menú.</p>
        </div>
      </div>
    </div>
  );
}
