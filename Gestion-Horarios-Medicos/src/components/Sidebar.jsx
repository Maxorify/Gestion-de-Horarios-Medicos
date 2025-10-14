// SidebarAdmin.jsx
import { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, Typography, useTheme, IconButton, Tooltip } from "@mui/material";
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
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import RegistroPacienteDialog from "@/features/pacientes/components/RegistroPacienteDialog.jsx";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

const Item = ({
  title,
  to,
  icon,
  selected,
  setSelected,
  isCollapsed,
  colors,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    setSelected(title);
    navigate(to);
  };

  // Colores dinámicos
  const isLight = theme.palette.mode === "light";
  const itemColor = isLight ? "#111" : colors.grey[100];
  const activeColor = isLight ? "#4377fe" : colors.blueAccent[400];

  return (
    <MenuItem
      active={selected === title}
      style={{
        color: selected === title ? activeColor : itemColor,
        transition: "color 0.3s ease",
        fontWeight: selected === title ? "bold" : "normal",
        borderRadius: "18px",
        margin: isCollapsed ? "8px 0" : "3px 0",
        padding: isCollapsed ? "2px 0" : "0",
      }}
      onClick={handleClick}
      icon={icon}
      sx={{
        "&:hover": {
          backgroundColor: isLight
            ? "rgba(100,100,100,0.06)"
            : "rgba(255,255,255,0.06)",
          color: isLight ? "#111" : colors.blueAccent[300],
          borderRadius: "18px",
        },
      }}
    >
      {!isCollapsed && <Typography>{title}</Typography>}
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selected, setSelected] = useState("Dashboard");
  const [isPinned, setIsPinned] = useState(false);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPacienteCheck, setOpenPacienteCheck] = useState(false);
  const [showFormularioPaciente, setShowFormularioPaciente] = useState(false);

  const navigate = useNavigate();

  // --- Diálogos ---
  const handleAgendarClick = () => setOpenConfirm(true);
  const handleConfirmYes = () => {
    setOpenConfirm(false);
    setOpenPacienteCheck(true);
  };
  const handleConfirmNo = () => setOpenConfirm(false);
  const handlePacienteCheckYes = () => {
    setOpenPacienteCheck(false);
    navigate("/admin/agendar");
  };
  const handlePacienteCheckNo = () => {
    setOpenPacienteCheck(false);
    setShowFormularioPaciente(true);
  };

  // Hover reveal y pin
  const handleMouseEnter = () => {
    if (!isPinned) setIsCollapsed(false);
  };
  const handleMouseLeave = () => {
    if (!isPinned) setIsCollapsed(true);
  };
  const togglePin = () => {
    setIsPinned((p) => !p);
    setIsCollapsed((prev) => (isPinned ? true : false));
  };

  // Colores adaptativos
  const isLight = theme.palette.mode === "light";
  const sidebarBg = isLight ? "#fafafa" : colors.primary[400];
  const textPrimary = isLight ? "#111" : colors.grey[100];
  const textSecondary = isLight ? "#222" : colors.grey[300];
  const borderColor = isLight ? "#ddd" : colors.grey[700];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--scrollbar-thumb",
      isLight ? "#ccc" : colors.grey[600]
    );
  }, [theme.palette.mode, colors, isLight]);

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        height: "100vh",
        "& .pro-sidebar-inner": {
          background: `${sidebarBg} !important`,
          scrollbarWidth: "thin",
          scrollbarColor: `#ccc ${sidebarBg}`,
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--scrollbar-thumb)",
            borderRadius: "3px",
          },
          boxShadow: isLight
            ? "2px 0 8px rgba(0,0,0,0.07)"
            : "2px 0 10px rgba(0,0,0,0.25)",
          transition: "all 0.3s ease",
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
          color: textPrimary,
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
          color: textPrimary,
          transition: "all 0.3s ease !important",
        },
        "& .pro-inner-item:hover": {
          backgroundColor: isLight
            ? "rgba(100,100,100,0.06) !important"
            : "rgba(255,255,255,0.06) !important",
          color: isLight
            ? "#111 !important"
            : colors.blueAccent[300] + " !important",
          borderRadius: "18px",
        },
        "& .pro-menu-item.active": {
          color: "#4377fe !important",
          backgroundColor: isLight
            ? "rgba(50,50,50,0.09) !important"
            : colors.blueAccent[900] + "40 !important",
          borderRadius: "18px",
        },
        "& .pro-menu-item.active .pro-icon-wrapper": {
          color: "#4377fe !important",
        },
      }}
      className="custom-scrollbar"
    >
      {/* Diálogos */}
      <Dialog open={openConfirm} onClose={handleConfirmNo}>
        <DialogTitle>Confirmar inicio</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Desea iniciar el proceso de agendamiento de una consulta?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmNo}>Cancelar</Button>
          <Button onClick={handleConfirmYes} autoFocus>
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openPacienteCheck} onClose={handlePacienteCheckNo}>
        <DialogTitle>Verificación de paciente</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿El paciente ya se encuentra registrado en la base de datos?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePacienteCheckNo}>No</Button>
          <Button onClick={handlePacienteCheckYes} autoFocus>
            Sí
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sidebar principal */}
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          {/* Perfil y pin */}
          {!isCollapsed && (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{
                borderBottom: `1px solid ${borderColor}`,
                pb: 2,
                mb: 2,
                position: "relative",
              }}
            >
              {/* Pin */}
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                }}
              >
                <Tooltip
                  title={isPinned ? "Desfijar sidebar" : "Fijar sidebar"}
                >
                  <IconButton
                    onClick={togglePin}
                    size="small"
                    sx={{
                      color: isPinned ? "#4377fe" : textSecondary,
                      "&:hover": {
                        color: "#4377fe",
                        backgroundColor: isLight
                          ? "rgba(0,0,0,0.04)"
                          : "rgba(255,255,255,0.10)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isPinned ? (
                      <PushPinIcon fontSize="small" />
                    ) : (
                      <PushPinOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=admin"
                alt="avatar"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  marginBottom: 8,
                  background: isLight ? "#c7d8ff" : colors.blueAccent[600],
                  border: `2px solid ${borderColor}`,
                }}
              />
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color={textPrimary}
                align="center"
              >
                Admin
              </Typography>
              <Typography
                variant="caption"
                color={textSecondary}
                align="center"
                sx={{ fontSize: 12 }}
              >
                admin@clinica.com
              </Typography>
            </Box>
          )}

          {/* Menú Items */}
          <Box
            display="flex"
            flexDirection="column"
            gap={isCollapsed ? 2 : 0}
            paddingLeft={isCollapsed ? 0 : "10%"}
            alignItems={isCollapsed ? "center" : "stretch"}
            sx={{
              width: isCollapsed ? "102px" : "100%",
              maxHeight: "calc(100vh - 200px)",
              overflowY: "auto",
              overflowX: "hidden",
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
              colors={colors}
            />
            {!isCollapsed && (
              <Typography
                variant="h6"
                color={isLight ? "#111" : colors.grey[100]}
                sx={{
                  m: "15px 0 5px 20px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
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
              colors={colors}
            />
            <Item
              title="Asignar Horarios"
              to="/admin/asignar-horarios"
              icon={<ScheduleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              colors={colors}
            />
            <Item
              title="Registro de Asistencia"
              to="/admin/asistencias"
              icon={<FactCheckOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              colors={colors}
            />

            {!isCollapsed && (
              <Typography
                variant="h6"
                color={isLight ? "#111" : colors.grey[100]}
                sx={{
                  m: "15px 0 5px 20px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                Pacientes y citas
              </Typography>
            )}
            <Item
              title="Pacientes"
              to="/admin/pacientes"
              icon={<AssignmentIndOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              colors={colors}
            />
            <MenuItem
              active={selected === "Agendar Consulta"}
              icon={<CalendarMonthOutlinedIcon />}
              style={{
                color: selected === "Agendar Consulta" ? "#4377fe" : "#111",
                fontWeight: selected === "Agendar Consulta" ? "bold" : "normal",
                borderRadius: "18px",
              }}
              onClick={handleAgendarClick}
              sx={{
                "&:hover": {
                  backgroundColor: "rgba(100,100,100,0.06)",
                  color: "#111",
                  borderRadius: "18px",
                },
              }}
            >
              {!isCollapsed && <Typography>Agendar Consulta</Typography>}
            </MenuItem>

            {!isCollapsed && (
              <Typography
                variant="h6"
                color={isLight ? "#111" : colors.grey[100]}
                sx={{
                  m: "15px 0 5px 20px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                Reportes y estadísticas
              </Typography>
            )}
            <Item
              title="Reportes de Asistencia"
              to="/admin/reportes-asistencia"
              icon={<AssessmentOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              colors={colors}
            />

            {!isCollapsed && (
              <Typography
                variant="h6"
                color={isLight ? "#111" : colors.grey[100]}
                sx={{
                  m: "15px 0 5px 20px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
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
              colors={colors}
            />
            <Item
              title="Soporte y Ayuda"
              to="/admin/soporte"
              icon={<HelpOutlineOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              isCollapsed={isCollapsed}
              colors={colors}
            />
          </Box>
        </Menu>
      </ProSidebar>

      <RegistroPacienteDialog
        open={showFormularioPaciente}
        onClose={() => setShowFormularioPaciente(false)}
      />
    </Box>
  );
};

export default Sidebar;
