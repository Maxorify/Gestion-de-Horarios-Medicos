import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";

import { SidebarBase } from "./SidebarBase";

const adminMenuGroups = [
  {
    heading: null,
    items: [
      {
        title: "Dashboard",
        to: "/admin",
        icon: <HomeOutlinedIcon />,
        matchChildren: false,
      },
    ],
  },
  {
    heading: "Gestión médica",
    items: [
      { title: "Doctores", to: "/admin/doctores", icon: <GroupOutlinedIcon /> },
      {
        title: "Asignar horarios",
        to: "/admin/asignar-horarios",
        icon: <ScheduleOutlinedIcon />,
      },
      {
        title: "Registro de asistencia",
        to: "/admin/asistencias",
        icon: <FactCheckOutlinedIcon />,
      },
    ],
  },
  {
    heading: "Pacientes y citas",
    items: [
      {
        title: "Pacientes",
        to: "/admin/pacientes",
        icon: <AssignmentIndOutlinedIcon />,
      },
      {
        title: "Agendar consulta",
        to: "/admin/agendar",
        icon: <CalendarMonthOutlinedIcon />,
      },
      {
        title: "Mis citas",
        to: "/admin/mis-citas",
        icon: <CalendarMonthOutlinedIcon />,
      },
    ],
  },
  {
    heading: "Reportes y estadísticas",
    items: [
      {
        title: "Reportes de asistencia",
        to: "/admin/reportes-asistencia",
        icon: <AssessmentOutlinedIcon />,
      },
    ],
  },
  {
    heading: "Configuración",
    items: [
      {
        title: "Usuarios del sistema",
        to: "/admin/usuarios",
        icon: <SettingsOutlinedIcon />,
      },
      {
        title: "Ajustes del sistema",
        to: "/admin/configuracion",
        icon: <SettingsOutlinedIcon />,
      },
      {
        title: "Soporte y ayuda",
        to: "/admin/soporte",
        icon: <HelpOutlineOutlinedIcon />,
      },
    ],
  },
];

export function SidebarAdmin() {
  return <SidebarBase menuGroups={adminMenuGroups} />;
}

export default SidebarAdmin;
