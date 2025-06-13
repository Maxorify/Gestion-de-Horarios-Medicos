import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material";
import { ColorModeContext, tokens } from "../theme";
import Topbar from "../components/Topbar";
import Sidebar from "../components/SidebarAdmin";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

function AdminPanel() {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const [isThemeSwitching, setIsThemeSwitching] = useState(false);

  // Efecto para manejar las transiciones de tema
  useEffect(() => {
    const root = document.documentElement;
    
    // Establecer el atributo data-theme para CSS
    root.setAttribute("data-theme", theme.palette.mode);
    
    // Aplicar variables CSS dinámicamente
    if (theme.palette.mode === "dark") {
      root.style.setProperty("--scrollbar-track", colors.primary[400]);
      root.style.setProperty("--scrollbar-thumb", colors.grey[600]);
      root.style.setProperty("--scrollbar-thumb-hover", colors.grey[500]);
      root.style.setProperty("--scrollbar-thumb-active", colors.greenAccent[600]);
      root.style.setProperty("--bg-primary", colors.primary[500]);
      root.style.setProperty("--bg-secondary", colors.primary[400]);
      root.style.setProperty("--text-primary", colors.grey[100]);
      root.style.setProperty("--text-secondary", colors.grey[300]);
    } else {
      root.style.setProperty("--scrollbar-track", colors.primary[400]);
      root.style.setProperty("--scrollbar-thumb", colors.grey[400]);
      root.style.setProperty("--scrollbar-thumb-hover", colors.grey[600]);
      root.style.setProperty("--scrollbar-thumb-active", colors.greenAccent[500]);
      root.style.setProperty("--bg-primary", "#fcfcfc");
      root.style.setProperty("--bg-secondary", colors.primary[400]);
      root.style.setProperty("--text-primary", colors.grey[100]);
      root.style.setProperty("--text-secondary", colors.grey[300]);
    }
  }, [theme.palette.mode, colors]);

  // Función mejorada para manejar el cambio de tema con transición
  const handleThemeToggle = () => {
    setIsThemeSwitching(true);
    
    // Agregar clase de transición al documento
    document.body.classList.add('theme-switching');
    
    // Cambiar el tema
    colorMode.toggleColorMode();
    
    // Remover la clase después de la transición
    setTimeout(() => {
      setIsThemeSwitching(false);
      document.body.classList.remove('theme-switching');
    }, 600); // Duración de la transición
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  // Estilos dinámicos que responden al tema
  const mainContentStyle = {
    flex: 1,
    backgroundColor: theme.palette.mode === "dark" 
      ? colors.primary[500] 
      : "#fcfcfc",
    color: theme.palette.mode === "dark" 
      ? colors.grey[100] 
      : colors.grey[900],
    minHeight: "100vh",
    transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  };

  const contentAreaStyle = {
    padding: 24,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    background: theme.palette.mode === "dark" 
      ? `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[400]} 100%)`
      : `linear-gradient(135deg, #fcfcfc 0%, ${colors.primary[400]} 100%)`,
    minHeight: "calc(100vh - 64px)", // Altura menos el topbar
    borderRadius: "8px 0 0 0",
  };

  const welcomeTextStyle = {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: theme.palette.mode === "dark" 
      ? colors.grey[100] 
      : colors.grey[900],
    marginBottom: "1rem",
    textShadow: theme.palette.mode === "dark" 
      ? "0 2px 4px rgba(0,0,0,0.3)" 
      : "0 2px 4px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
  };

  return (
    <div 
      style={{ 
        display: "flex", 
        height: "100vh",
        backgroundColor: theme.palette.mode === "dark" 
          ? colors.primary[500] 
          : "#fcfcfc",
        transition: "background-color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}
      className={`admin-panel-content custom-scrollbar ${isThemeSwitching ? 'theme-transition-highlight' : ''}`}
    >
      <Sidebar />
      <div style={mainContentStyle} className="main-content">
        <Topbar onThemeToggle={handleThemeToggle} />
        <div style={contentAreaStyle}>
          <h1 style={welcomeTextStyle}>
            Bienvenido Admin
          </h1>
          
          {/* Indicador visual del tema actual */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 16px",
            borderRadius: "20px",
            backgroundColor: theme.palette.mode === "dark" 
              ? colors.primary[400] 
              : colors.grey[200],
            color: theme.palette.mode === "dark" 
              ? colors.grey[100] 
              : colors.grey[800],
            fontSize: "0.875rem",
            fontWeight: "500",
            marginBottom: "2rem",
            transition: "all 0.3s ease",
            border: `1px solid ${theme.palette.mode === "dark" 
              ? colors.grey[700] 
              : colors.grey[300]}`,
          }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: theme.palette.mode === "dark" 
                ? colors.blueAccent[400] 
                : colors.blueAccent[600],
              marginRight: "8px",
              transition: "background-color 0.3s ease",
            }}></span>
            Modo {theme.palette.mode === "dark" ? "Oscuro" : "Claro"} Activo
          </div>

          {/* Contenido adicional con mejor estilo */}
          <div style={{
            padding: "24px",
            borderRadius: "12px",
            backgroundColor: theme.palette.mode === "dark" 
              ? colors.primary[400] 
              : "rgba(255, 255, 255, 0.8)",
            boxShadow: theme.palette.mode === "dark"
              ? "0 4px 12px rgba(0, 0, 0, 0.3)"
              : "0 4px 12px rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${theme.palette.mode === "dark" 
              ? colors.grey[700] 
              : colors.grey[200]}`,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <p style={{
              color: theme.palette.mode === "dark" 
                ? colors.grey[300] 
                : colors.grey[700],
              lineHeight: "1.6",
              margin: 0,
              transition: "color 0.3s ease",
            }}>
              Panel de administración con transiciones suaves y scrollbar personalizado. 
              El tema se adapta automáticamente y todos los elementos tienen transiciones elegantes.
            </p>
          </div>

          {/* Acá va el resto de tu contenido */}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;