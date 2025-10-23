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
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { logout as logoutLocal } from "@/services/authLocal";


const Topbar = ({ onThemeToggle }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const transparentWhite = (opacity) => alpha(theme.palette.common.white, opacity);
  const transparentBlack = (opacity) => alpha(theme.palette.common.black, opacity);

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
    if (onThemeToggle) {
      onThemeToggle(); // Llama la función que viene como prop
    } else {
      colorMode.toggleColorMode(); // Fallback al método original
    }
  };

  // Estilos dinámicos mejorados
  const topbarStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    background:
      theme.palette.mode === "dark"
        ? `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[500]} 100%)`
        : transparentWhite(0.95),
    backdropFilter: "blur(15px)",
    borderBottom:
      theme.palette.mode === "dark"
        ? `1px solid ${colors.grey[700]}`
        : `1px solid ${transparentBlack(0.08)}`,
    boxShadow:
      theme.palette.mode === "dark"
        ? `
        0 4px 20px ${transparentBlack(0.4)},
        0 1px 0 ${transparentWhite(0.05)} inset,
        0 -1px 0 ${transparentBlack(0.2)} inset
      `
        : `
        0 4px 20px ${transparentBlack(0.08)},
        0 1px 0 ${transparentWhite(0.8)} inset,
        0 -1px 0 ${transparentBlack(0.05)} inset
      `,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    minHeight: "64px",
    position: "relative",
    zIndex: 1000,
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: "-20px",
      left: 0,
      right: 0,
      height: "20px",
      background:
        theme.palette.mode === "dark"
          ? `linear-gradient(to bottom, ${transparentBlack(0.1)}, transparent)`
          : `linear-gradient(to bottom, ${transparentBlack(0.02)}, transparent)`,
      pointerEvents: "none",
    },
  };

  const searchBoxStyle = {
    display: "flex",
    alignItems: "center",
    backgroundColor:
      theme.palette.mode === "dark"
        ? transparentWhite(0.08)
        : transparentWhite(0.9),
    borderRadius: "28px",
    border:
      theme.palette.mode === "dark"
        ? `1px solid ${transparentWhite(0.1)}`
        : `1px solid ${transparentBlack(0.08)}`,
    padding: "4px 16px",
    minWidth: "300px",
    maxWidth: "400px",
    transition: "all 0.3s ease",
    boxShadow:
      theme.palette.mode === "dark"
        ? `
        inset 0 2px 4px ${transparentBlack(0.3)},
        0 1px 0 ${transparentWhite(0.05)}
      `
        : `
        inset 0 2px 4px ${transparentBlack(0.05)},
        0 1px 0 ${transparentWhite(0.8)}
      `,
    "&:focus-within": {
      borderColor: colors.blueAccent[500],
      boxShadow: `
        0 0 0 2px ${alpha(colors.blueAccent[500], 0.125)},
        inset 0 2px 4px ${transparentBlack(0.1)}
      `,
      transform: "translateY(-1px)",
    },
  };

  const iconButtonStyle = {
    backgroundColor:
      theme.palette.mode === "dark"
        ? transparentWhite(0.05)
        : transparentBlack(0.04),
    color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[700],
    margin: "0 4px",
    width: "44px",
    height: "44px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border:
      theme.palette.mode === "dark"
        ? `1px solid ${transparentWhite(0.08)}`
        : `1px solid ${transparentBlack(0.06)}`,
    boxShadow:
      theme.palette.mode === "dark"
        ? `
        0 2px 8px ${transparentBlack(0.2)},
        inset 0 1px 0 ${transparentWhite(0.1)}
      `
        : `
        0 2px 8px ${transparentBlack(0.05)},
        inset 0 1px 0 ${transparentWhite(0.8)}
      `,
    "&:hover": {
      backgroundColor: colors.blueAccent[500],
      color: theme.palette.common.white,
      transform: "translateY(-2px)",
      boxShadow: `
        0 8px 25px ${alpha(colors.blueAccent[500], 0.25)},
        0 4px 12px ${alpha(colors.blueAccent[500], 0.18)}
      `,
      borderColor: colors.blueAccent[400],
    },
  };

  const avatarStyle = {
    backgroundColor: colors.blueAccent[500],
    width: "40px",
    height: "40px",
    border: `2px solid ${
      theme.palette.mode === "dark"
        ? colors.grey[600]
        : transparentBlack(0.1)
    }`,
    transition: "all 0.3s ease",
    boxShadow:
      theme.palette.mode === "dark"
        ? `0 4px 12px ${transparentBlack(0.3)}`
        : `0 4px 12px ${transparentBlack(0.1)}`,
    "&:hover": {
      transform: "scale(1.05)",
      borderColor: colors.blueAccent[400],
      boxShadow: `0 6px 20px ${alpha(colors.blueAccent[500], 0.25)}`,
    },
  };

  return (
    <Box sx={topbarStyle}>
      {/* BARRA DE BÚSQUEDA */}
      <Box sx={searchBoxStyle}>
        <SearchIcon
          sx={{
            color:
              theme.palette.mode === "dark"
                ? colors.grey[300]
                : colors.grey[600],
            marginRight: "8px",
          }}
        />
        <InputBase
          sx={{
            ml: 1,
            flex: 1,
            color:
              theme.palette.mode === "dark"
                ? colors.grey[100]
                : theme.palette.text.primary,
            fontWeight: 500,
            "& ::placeholder": {
              color:
                theme.palette.mode === "dark"
                  ? colors.grey[400]
                  : colors.grey[500],
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
            theme.palette.mode === "dark" ? "claro" : "oscuro"
          }`}
        >
          <IconButton onClick={handleThemeToggle} sx={iconButtonStyle}>
            {theme.palette.mode === "dark" ? (
              <LightModeOutlinedIcon sx={{ color: theme.palette.common.black }} />
            ) : (
              <DarkModeOutlinedIcon sx={{ color: theme.palette.common.black }} />
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
                  color: theme.palette.common.white,
                  fontSize: "0.75rem",
                  boxShadow: `0 2px 8px ${alpha(colors.redAccent[500], 0.4)}`,
                },
              }}
            >
              <NotificationsOutlinedIcon sx={{ color: theme.palette.common.black }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Configuración */}
        <Tooltip title="Configuración">
          <IconButton sx={iconButtonStyle}>
            <SettingsOutlinedIcon sx={{ color: theme.palette.common.black }} />
          </IconButton>
        </Tooltip>

        {/* Separador visual */}
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              mx: 2,
              borderColor:
                theme.palette.mode === "dark"
                  ? transparentWhite(0.15)
                  : transparentBlack(0.1),
              height: "32px",
              alignSelf: "center",
              boxShadow:
                theme.palette.mode === "dark"
                  ? `1px 0 0 ${transparentWhite(0.05)}`
                  : `1px 0 0 ${transparentWhite(0.5)}`,
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
                  theme.palette.mode === "dark"
                    ? colors.grey[100]
                    : theme.palette.text.primary,
                fontWeight: 600,
                lineHeight: 1.2,
                textShadow:
                  theme.palette.mode === "dark"
                    ? `0 1px 2px ${transparentBlack(0.3)}`
                    : `0 1px 2px ${transparentWhite(0.8)}`,
              }}
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color:
                  theme.palette.mode === "dark"
                    ? colors.grey[300]
                    : colors.grey[500],
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
                <PersonOutlinedIcon sx={{ color: theme.palette.common.black }} />
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
                theme.palette.mode === "dark"
                  ? colors.primary[400]
                  : theme.palette.common.white,
              borderRadius: "16px",
              border:
                theme.palette.mode === "dark"
                  ? `1px solid ${colors.grey[600]}`
                  : `1px solid ${transparentBlack(0.08)}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? `
              0 20px 40px ${transparentBlack(0.5)},
              0 10px 20px ${transparentBlack(0.3)},
              inset 0 1px 0 ${transparentWhite(0.1)}
            `
                  : `
              0 20px 40px ${transparentBlack(0.15)},
              0 10px 20px ${transparentBlack(0.08)},
              inset 0 1px 0 ${transparentWhite(0.8)}
            `,
              minWidth: "200px",
              backdropFilter: "blur(20px)",
              "& .MuiMenuItem-root": {
                color:
                  theme.palette.mode === "dark"
                    ? colors.grey[100]
                    : theme.palette.text.primary,
                padding: "12px 20px",
                borderRadius: "12px",
                margin: "4px 8px",
                transition: "all 0.2s ease",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: colors.blueAccent[500],
                  color: theme.palette.common.white,
                  transform: "translateX(4px)",
                },
              },
            },
          }}
        >
          <MenuItem onClick={handleProfile}>
            <AccountCircleOutlinedIcon
              sx={{ color: theme.palette.common.black, mr: 2 }}
            />
            Mi Perfil
          </MenuItem>
          <Divider
            sx={{
              borderColor:
                theme.palette.mode === "dark"
                  ? colors.grey[600]
                  : colors.grey[300],
              margin: "8px 16px",
            }}
          />
          <MenuItem onClick={handleLogout}>
            <LogoutOutlinedIcon sx={{ color: theme.palette.common.black, mr: 2 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;
