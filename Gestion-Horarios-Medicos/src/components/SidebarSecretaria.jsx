import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";

import { SidebarBase } from "./SidebarBase";

const secretariaMenuGroups = [
  {
    heading: null,
    items: [
      {
        title: "Inicio",
        to: "/secretaria",
        icon: <HomeOutlinedIcon />,
        matchChildren: false,
      },
    ],
  },
  {
    heading: "Gestión diaria",
    items: [
      {
        title: "Check-in pacientes",
        to: "/secretaria/check-in",
        icon: <FactCheckOutlinedIcon />,
      },
      {
        title: "Agendar cita",
        to: "/secretaria/agendar",
        icon: <CalendarMonthOutlinedIcon />,
      },
      {
        title: "Caja / pagos",
        to: "/secretaria/caja",
        icon: <PointOfSaleOutlinedIcon />,
      },
    ],
  },
];

export function SidebarSecretaria() {
  return <SidebarBase menuGroups={secretariaMenuGroups} />;
}

export default SidebarSecretaria;
