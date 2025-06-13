// Sidebar.jsx - Versión actualizada con scrollbar personalizado
import { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import IconButton from "@mui/material/IconButton";

const Item = ({
  title,
  to,
  icon,
  selected,
  setSelected,
  isCollapsed,
  setIsCollapsed,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const handleClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
    } else {
      setSelected(title);
      navigate(to);
    }
  };

  return (
    <MenuItem
      active={selected === title}
      style={{ color: colors.grey[100] }}
      onClick={handleClick}
      icon={icon}
    >
      {!isCollapsed && <Typography>{title}</Typography>}
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");

  // Efecto para actualizar las variables CSS del tema
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme.palette.mode === "dark") {
      root.setAttribute("data-theme", "dark");
      // Variables para modo oscuro
      root.style.setProperty("--scrollbar-track", colors.primary[400]);
      root.style.setProperty("--scrollbar-thumb", colors.grey[600]);
      root.style.setProperty("--scrollbar-thumb-hover", colors.grey[500]);
      root.style.setProperty("--scrollbar-thumb-active", colors.greenAccent[600]);
    } else {
      root.setAttribute("data-theme", "light");
      // Variables para modo claro
      root.style.setProperty("--scrollbar-track", colors.primary[400]);
      root.style.setProperty("--scrollbar-thumb", colors.grey[400]);
      root.style.setProperty("--scrollbar-thumb-hover", colors.grey[600]);
      root.style.setProperty("--scrollbar-thumb-active", colors.greenAccent[500]);
    }
  }, [theme.palette.mode, colors]);

  return (
    <Box
      sx={{
        height: "100vh",
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
          // Aplicar clase para scrollbar personalizado
          "&.custom-scrollbar": {
            scrollbarWidth: "thin",
            scrollbarColor: `${colors.grey[600]} ${colors.primary[400]}`,
          },
          // Webkit scrollbar styles
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: colors.grey[600],
            borderRadius: "3px",
            transition: "all 0.3s ease",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: colors.grey[500],
            width: "8px",
          },
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
      }}
      className="custom-scrollbar"
    >
      <ProSidebar 
        collapsed={isCollapsed}
        className={isCollapsed ? "collapsed" : ""}
      >
        <Menu iconShape="square">
          {/* --- Botón menú arriba --- */}
          <Box
            display="flex"
            justifyContent={isCollapsed ? "center" : "flex-end"}
            alignItems="center"
            sx={{
              height: 64,
              mb: isCollapsed ? 0 : 1,
              mt: isCollapsed ? 1.5 : 0,
              pr: isCollapsed ? 0 : 1.5,
            }}
          >
            <IconButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              sx={{
                background:
                  theme.palette.mode === "dark"
                    ? colors.primary[500]
                    : colors.grey[300],
                color:
                  theme.palette.mode === "dark"
                    ? colors.grey[100]
                    : colors.grey[900],
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                transition: "background 0.3s",
                boxShadow: "0 1px 5px #0002",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  background: colors.greenAccent[600],
                },
                cursor: "pointer",
              }}
            >
              <MenuOutlinedIcon
                fontSize="medium"
                sx={{
                  color:
                    theme.palette.mode === "dark"
                      ? colors.grey[100]
                      : colors.grey[900],
                }}
              />
            </IconButton>
          </Box>

          {/* --- Perfil (solo abierto) --- */}
          {!isCollapsed && (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{
                borderBottom: "1px solid #d1d5db",
                pb: 2,
                mb: 2,
              }}
            >
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=admin"
                alt="avatar"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  marginBottom: 8,
                  background:
                    theme.palette.mode === "dark" ? "#7c3aed" : "#a5b4fc",
                }}
              />

              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color={colors.grey[100]}
                align="center"
              >
                Admin
              </Typography>
              <Typography
                variant="caption"
                color={colors.grey[300]}
                align="center"
                sx={{ fontSize: 12 }}
              >
                admin@clinica.com
              </Typography>
            </Box>
          )}

          {/* --- Menú Items --- */}
          <Box
            display="flex"
            flexDirection="column"
            gap={isCollapsed ? 2 : 0}
            paddingLeft={isCollapsed ? 2.5 : "10%"}
            alignItems={isCollapsed ? "center" : "stretch"}
            sx={{ 
              width: "100%",
              maxHeight: "calc(100vh - 200px)",
              overflowY: "auto",
              // Aplicar scrollbar personalizado al contenedor de menú
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: colors.grey[600],
                borderRadius: "2px",
                transition: "background 0.3s ease",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: colors.grey[500],
              },
            }}
            className="custom-scrollbar"
          >
            <Item
              title="Dashboard"
              to="/admin"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
            {/* Gestión Médica */}
            {!isCollapsed && (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Gestión Médica
              </Typography>
            )}
            <Item
              title="Doctores"
              to="/admin/doctores"
              icon={<GroupOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
            <Item
              title="Asignar Horarios"
              to="/admin/asignar-horarios"
              icon={<ScheduleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
            <Item
              title="Registro de Asistencia"
              to="/admin/asistencias"
              icon={<FactCheckOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
            {/* Pacientes y Citas */}
            {!isCollapsed && (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Pacientes y Citas
              </Typography>
            )}
            <Item
              title="Pacientes"
              to="/admin/pacientes"
              icon={<AssignmentIndOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
            <Item
              title="Agendar Consulta"
              to="/admin/agendar"
              icon={<CalendarMonthOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
            {/* Reportes y Estadísticas */}
            {!isCollapsed && (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Reportes y Estadísticas
              </Typography>
            )}
            <Item
              title="Reportes de Asistencia"
              to="/admin/reportes-asistencia"
              icon={<AssessmentOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
            {/* Configuración */}
            {!isCollapsed && (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Configuración
              </Typography>
            )}
            <Item
              title="Ajustes del sistema"
              to="/admin/configuracion"
              icon={<SettingsOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
            <Item
              title="Soporte y Ayuda"
              to="/admin/soporte"
              icon={<HelpOutlineOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
            <Item
              title="Cerrar sesión"
              to="/"
              icon={<LogoutOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;