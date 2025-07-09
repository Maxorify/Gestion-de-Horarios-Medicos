import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material";
import { ColorModeContext, tokens } from "../theme";
import Topbar from "../components/Topbar";
import Sidebar from "../components/SidebarAdmin";
import ChatbotPopup from "../components/ChatbotPopup"; // ← chatbot importado

function AdminPanel() {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const [isThemeSwitching, setIsThemeSwitching] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-theme", theme.palette.mode);

    if (theme.palette.mode === "dark") {
      root.style.setProperty("--scrollbar-track", colors.primary[400]);
      root.style.setProperty("--scrollbar-thumb", colors.grey[600]);
      root.style.setProperty("--scrollbar-thumb-hover", colors.grey[500]);
      root.style.setProperty(
        "--scrollbar-thumb-active",
        colors.greenAccent[600]
      );
      root.style.setProperty("--bg-primary", colors.primary[500]);
      root.style.setProperty("--bg-secondary", colors.primary[400]);
      root.style.setProperty("--text-primary", colors.grey[100]);
      root.style.setProperty("--text-secondary", colors.grey[300]);
    } else {
      root.style.setProperty("--scrollbar-track", "#f5f5f5");
      root.style.setProperty("--scrollbar-thumb", colors.grey[400]);
      root.style.setProperty("--scrollbar-thumb-hover", colors.grey[600]);
      root.style.setProperty(
        "--scrollbar-thumb-active",
        colors.greenAccent[500]
      );
      root.style.setProperty("--bg-primary", "#f8f9fa");
      root.style.setProperty("--bg-secondary", "#ffffff");
      root.style.setProperty("--text-primary", colors.grey[900]);
      root.style.setProperty("--text-secondary", colors.grey[700]);
    }
  }, [theme.palette.mode, colors]);

  const handleThemeToggle = () => {
    setIsThemeSwitching(true);
    document.body.classList.add("theme-switching");
    colorMode.toggleColorMode();
    setTimeout(() => {
      setIsThemeSwitching(false);
      document.body.classList.remove("theme-switching");
    }, 600);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  const mainContentStyle = {
    flex: 1,
    backgroundColor:
      theme.palette.mode === "dark" ? colors.primary[500] : "#f8f9fa",
    color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[900],
    minHeight: "100vh",
    transition: "all 0.4s ease",
  };

  const contentAreaStyle = {
    padding: "24px",
    transition: "all 0.3s ease",
    minHeight: "calc(100vh - 64px)",
    position: "relative",
  };

  const containerStyle = {
    backgroundColor:
      theme.palette.mode === "dark" ? colors.primary[400] : "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 8px 32px rgba(0, 0, 0, 0.4)"
        : "0 4px 20px rgba(0, 0, 0, 0.08)",
    border:
      theme.palette.mode === "dark"
        ? `1px solid ${colors.grey[700]}`
        : `1px solid ${colors.grey[200]}`,
    transition: "all 0.3s ease",
    minHeight: "calc(100vh - 112px)",
    position: "relative",
    // OJO: no pongas overflow: hidden aquí
  };

  const welcomeTextStyle = {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? colors.grey[100] : "#1a1a1a",
    marginBottom: "1rem",
    textShadow:
      theme.palette.mode === "dark" ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
    transition: "all 0.3s ease",
    zIndex: 10,
    position: "relative",
  };

  const themeIndicatorStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "12px 20px",
    borderRadius: "24px",
    backgroundColor:
      theme.palette.mode === "dark" ? colors.primary[500] : colors.grey[100],
    color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[800],
    fontSize: "0.875rem",
    fontWeight: "600",
    marginBottom: "2rem",
    transition: "all 0.3s ease",
    border: `1px solid ${
      theme.palette.mode === "dark" ? colors.grey[600] : colors.grey[300]
    }`,
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 2px 8px rgba(0, 0, 0, 0.2)"
        : "0 2px 8px rgba(0, 0, 0, 0.06)",
  };

  const infoCardStyle = {
    padding: "24px",
    borderRadius: "16px",
    backgroundColor:
      theme.palette.mode === "dark" ? colors.primary[500] : colors.grey[50],
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 4px 16px rgba(0, 0, 0, 0.3)"
        : "0 2px 12px rgba(0, 0, 0, 0.06)",
    backdropFilter: "blur(10px)",
    border: `1px solid ${
      theme.palette.mode === "dark" ? colors.grey[600] : colors.grey[200]
    }`,
    transition: "all 0.3s ease",
    position: "relative",
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor:
          theme.palette.mode === "dark" ? colors.primary[500] : "#f8f9fa",
        transition: "background-color 0.4s ease",
      }}
      className={`admin-panel-content custom-scrollbar ${
        isThemeSwitching ? "theme-transition-highlight" : ""
      }`}
    >
      <Sidebar />
      <div style={mainContentStyle} className="main-content">
        <Topbar onThemeToggle={handleThemeToggle} />
        <div style={contentAreaStyle}>
          <div style={containerStyle}>
            <h1 style={welcomeTextStyle}>Bienvenido Admin</h1>

            <div style={themeIndicatorStyle}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? colors.blueAccent[400]
                      : colors.blueAccent[600],
                  marginRight: "12px",
                  transition: "background-color 0.3s ease",
                  boxShadow: `0 0 0 2px ${
                    theme.palette.mode === "dark"
                      ? colors.blueAccent[400]
                      : colors.blueAccent[600]
                  }30`,
                }}
              ></span>
              Modo {theme.palette.mode === "dark" ? "Oscuro" : "Claro"} Activo
            </div>

            <div style={infoCardStyle}>
              <h3
                style={{
                  color:
                    theme.palette.mode === "dark"
                      ? colors.grey[100]
                      : colors.grey[800],
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "16px",
                  transition: "color 0.3s ease",
                }}
              >
                Panel de Administración
              </h3>
              <p
                style={{
                  color:
                    theme.palette.mode === "dark"
                      ? colors.grey[300]
                      : colors.grey[600],
                  lineHeight: "1.6",
                  margin: 0,
                  fontSize: "1rem",
                  transition: "color 0.3s ease",
                }}
              >
                Panel de administración con transiciones suaves y scrollbar
                personalizado. El tema se adapta automáticamente y todos los
                elementos tienen transiciones elegantes. Ahora con contenedores
                bien definidos para mejor legibilidad en ambos modos.
              </p>
            </div>

            <div
              style={{
                marginTop: "2rem",
                display: "grid",
                gap: "20px",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              }}
            >
              <div style={infoCardStyle}>
                <h4
                  style={{
                    color:
                      theme.palette.mode === "dark"
                        ? colors.grey[100]
                        : colors.grey[800],
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    marginBottom: "12px",
                    transition: "color 0.3s ease",
                  }}
                >
                  Estadísticas Rápidas
                </h4>
                <p
                  style={{
                    color:
                      theme.palette.mode === "dark"
                        ? colors.grey[300]
                        : colors.grey[600],
                    margin: 0,
                    fontSize: "0.9rem",
                  }}
                >
                  Usuarios activos: 1,234
                  <br />
                  Sesiones hoy: 567
                  <br />
                  Rendimiento: 98.5%
                </p>
              </div>

              <div style={infoCardStyle}>
                <h4
                  style={{
                    color:
                      theme.palette.mode === "dark"
                        ? colors.grey[100]
                        : colors.grey[800],
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    marginBottom: "12px",
                    transition: "color 0.3s ease",
                  }}
                >
                  Acciones Rápidas
                </h4>
                <p
                  style={{
                    color:
                      theme.palette.mode === "dark"
                        ? colors.grey[300]
                        : colors.grey[600],
                    margin: 0,
                    fontSize: "0.9rem",
                  }}
                >
                  Configura fácilmente tu panel desde aquí. Todos los elementos
                  están optimizados para una excelente experiencia visual.
                </p>
              </div>
            </div>
          </div>

          {/* ← Chatbot flotante, visible en todo el panel */}
          <ChatbotPopup />
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
