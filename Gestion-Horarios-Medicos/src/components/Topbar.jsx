import {
  Box,
  IconButton,
  useTheme,
  Menu,
  MenuItem,
  Badge,
  Avatar,
  Tooltip,
  Typography,
  Divider,
} from "@mui/material";
import { useContext, useState } from "react";
import { ColorModeContext, tokens } from "../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { logout as logoutLocal } from "@/services/authLocal";


const Topbar = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const colors = tokens(mode);
  const isDark = mode === "dark";

  // Menú desplegable
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const { user, logout: logoutUser } = useUser();
  const persona = user?.persona ?? null;
  const displayName = persona
    ? [persona.nombre, persona.apellido_paterno, persona.apellido_materno]
        .filter(Boolean)
        .join(" ")
    : user?.email ?? "Usuario";
  const roleLabel = (user?.rol ?? "Usuario").replace(
    /^./,
    (letter) => letter.toUpperCase()
  );
  const avatarSeed = persona?.rut || user?.email || "usuario";

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logoutLocal();
    logoutUser();
    navigate("/login", { replace: true });
  };
  const handleProfile = () => {
    setAnchorEl(null);
    // Aquí puedes agregar navegación al perfil
    // navigate("/admin/perfil");
  };

  // Función para manejar el cambio de tema
  const handleThemeToggle = () => {
    toggleColorMode();
  };

  // Estilos dinámicos mejorados
  const topbarStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    background:
      isDark
        ? `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[500]} 100%)`
        : "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(15px)",
    borderBottom:
      isDark
        ? `1px solid ${colors.grey[700]}`
        : `1px solid rgba(0, 0, 0, 0.08)`,
    // Efecto de sombra difuminada elegante
    boxShadow:
      isDark
        ? `
        0 4px 20px rgba(0, 0, 0, 0.4),
        0 1px 0 rgba(255, 255, 255, 0.05) inset,
        0 -1px 0 rgba(0, 0, 0, 0.2) inset
      `
        : `
        0 4px 20px rgba(0, 0, 0, 0.08),
        0 1px 0 rgba(255, 255, 255, 0.8) inset,
        0 -1px 0 rgba(0, 0, 0, 0.05) inset
      `,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    minHeight: "64px",
    position: "relative",
    zIndex: 1000,
    // Efecto de difuminado en el borde inferior
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: "-20px",
      left: 0,
      right: 0,
      height: "20px",
      background:
        isDark
          ? `linear-gradient(to bottom, rgba(0, 0, 0, 0.1), transparent)`
          : `linear-gradient(to bottom, rgba(0, 0, 0, 0.02), transparent)`,
      pointerEvents: "none",
    },
  };

  const searchBoxStyle = {
    display: "flex",
    alignItems: "center",
    backgroundColor:
      isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(255, 255, 255, 0.9)",
    borderRadius: "28px",
    border:
      isDark
        ? `1px solid rgba(255, 255, 255, 0.1)`
        : `1px solid rgba(0, 0, 0, 0.08)`,
    padding: "4px 16px",
    minWidth: "300px",
    maxWidth: "400px",
    transition: "all 0.3s ease",
    boxShadow:
      isDark
        ? `
        inset 0 2px 4px rgba(0, 0, 0, 0.3),
        0 1px 0 rgba(255, 255, 255, 0.05)
      `
        : `
        inset 0 2px 4px rgba(0, 0, 0, 0.05),
        0 1px 0 rgba(255, 255, 255, 0.8)
      `,
    "&:focus-within": {
      borderColor: colors.blueAccent[500],
      boxShadow: `
        0 0 0 2px ${colors.blueAccent[500]}20,
        inset 0 2px 4px rgba(0, 0, 0, 0.1)
      `,
      transform: "translateY(-1px)",
    },
  };

  const iconButtonStyle = {
    backgroundColor:
      isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.04)",
    color: isDark ? colors.grey[100] : colors.grey[700],
    margin: "0 4px",
    width: "44px",
    height: "44px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border:
      isDark
        ? "1px solid rgba(255, 255, 255, 0.08)"
        : "1px solid rgba(0, 0, 0, 0.06)",
    boxShadow:
      isDark
        ? `
        0 2px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1)
      `
        : `
        0 2px 8px rgba(0, 0, 0, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.8)
      `,
    "&:hover": {
      backgroundColor: colors.blueAccent[500],
      color: "#ffffff",
      transform: "translateY(-2px)",
      boxShadow: `
        0 8px 25px ${colors.blueAccent[500]}40,
        0 4px 12px ${colors.blueAccent[500]}30
      `,
      borderColor: colors.blueAccent[400],
    },
  };

  const avatarStyle = {
    backgroundColor: colors.blueAccent[500],
    width: "40px",
    height: "40px",
    border: `2px solid ${
      isDark ? colors.grey[600] : "rgba(0, 0, 0, 0.1)"
    }`,
    transition: "all 0.3s ease",
    boxShadow:
      isDark
        ? "0 4px 12px rgba(0, 0, 0, 0.3)"
        : "0 4px 12px rgba(0, 0, 0, 0.1)",
    "&:hover": {
      transform: "scale(1.05)",
      borderColor: colors.blueAccent[400],
      boxShadow: `0 6px 20px ${colors.blueAccent[500]}40`,
    },
  };

  return (
    <Box sx={topbarStyle}>
      {/* BARRA DE BÚSQUEDA */}
      <Box sx={searchBoxStyle}>
        <SearchIcon
          sx={{
            color:
              isDark
                ? colors.grey[300]
                : colors.grey[600],
            marginRight: "8px",
          }}
        />
        <InputBase
          sx={{
            ml: 1,
            flex: 1,
            color: isDark ? colors.grey[100] : "#000000",
            fontWeight: 500,
            "& ::placeholder": {
              color:
                isDark ? colors.grey[400] : "#666666",
              opacity: 1,
            },
          }}
          placeholder="Buscar pacientes, doctores, citas..."
        />
      </Box>
    
      {/* ICONOS Y PERFIL */}
      <Box display="flex" alignItems="center">
        {/* Botón de tema */}
        <Tooltip
          title={`Cambiar a modo ${
            isDark ? "claro" : "oscuro"
          }`}
        >
          <IconButton onClick={handleThemeToggle} sx={iconButtonStyle}>
            {isDark ? (
              <LightModeOutlinedIcon sx={{ color: "#000" }} />
            ) : (
              <DarkModeOutlinedIcon sx={{ color: "#000" }} />
            )}
          </IconButton>
        </Tooltip>

        {/* Notificaciones */}
        <Tooltip title="Notificaciones">
          <IconButton sx={iconButtonStyle}>
            <Badge
              badgeContent={3}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: colors.redAccent[500],
                  color: "white",
                  fontSize: "0.75rem",
                  boxShadow: "0 2px 8px rgba(244, 67, 54, 0.4)",
                },
              }}
            >
              <NotificationsOutlinedIcon sx={{ color: "#000" }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Configuración */}
        <Tooltip title="Configuración">
          <IconButton sx={iconButtonStyle}>
            <SettingsOutlinedIcon sx={{ color: "#000" }} />
          </IconButton>
        </Tooltip>

        {/* Separador visual */}
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mx: 2,
            borderColor:
              isDark
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.1)",
            height: "32px",
            alignSelf: "center",
            boxShadow:
              isDark
                ? "1px 0 0 rgba(255, 255, 255, 0.05)"
                : "1px 0 0 rgba(255, 255, 255, 0.5)",
          }}
        />

        {/* Perfil de usuario */}
        <Box display="flex" alignItems="center">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="flex-end"
            marginRight="12px"
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color:
                  isDark ? colors.grey[100] : "#000000",
                fontWeight: 600,
                lineHeight: 1.2,
                textShadow:
                  isDark
                    ? "0 1px 2px rgba(0, 0, 0, 0.3)"
                    : "0 1px 2px rgba(255, 255, 255, 0.8)",
              }}
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color:
                  isDark ? colors.grey[300] : "#666666",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            >
              {roleLabel}
            </Typography>
          </Box>

          <Tooltip title="Perfil de usuario">
            <IconButton
              onClick={handleMenu}
              sx={{
                padding: "2px",
                "&:hover": {
                  backgroundColor: "transparent",
                },
              }}
            >
              <Avatar
                sx={avatarStyle}
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
                  avatarSeed
                )}`}
              >
                <PersonOutlinedIcon sx={{ color: "#000" }} />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* MENÚ DESPLEGABLE */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              mt: 1,
              backgroundColor:
                isDark ? colors.primary[400] : "#ffffff",
              borderRadius: "16px",
              border:
                isDark
                  ? `1px solid ${colors.grey[600]}`
                  : `1px solid rgba(0, 0, 0, 0.08)`,
              boxShadow:
                isDark
                  ? `
              0 20px 40px rgba(0, 0, 0, 0.5),
              0 10px 20px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `
                  : `
              0 20px 40px rgba(0, 0, 0, 0.15),
              0 10px 20px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.8)
            `,
              minWidth: "200px",
              backdropFilter: "blur(20px)",
              "& .MuiMenuItem-root": {
                color:
                  isDark ? colors.grey[100] : "#000000",
                padding: "12px 20px",
                borderRadius: "12px",
                margin: "4px 8px",
                transition: "all 0.2s ease",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: colors.blueAccent[500],
                  color: "#ffffff",
                  transform: "translateX(4px)",
                },
              },
            },
          }}
        >
          <MenuItem onClick={handleProfile}>
            <AccountCircleOutlinedIcon sx={{ color: "#000", mr: 2 }} />
            Mi Perfil
          </MenuItem>
          <Divider
            sx={{
              borderColor:
                isDark
                  ? colors.grey[600]
                  : colors.grey[300],
              margin: "8px 16px",
            }}
          />
          <MenuItem onClick={handleLogout}>
            <LogoutOutlinedIcon sx={{ color: "#000", mr: 2 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;
