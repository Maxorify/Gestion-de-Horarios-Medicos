import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";

import { SidebarBase } from "./SidebarBase";

const doctorMenuGroups = [
  {
    heading: "Mi agenda",
    items: [
      {
        title: "Citas del día",
        to: "/doctor",
        icon: <TodayOutlinedIcon />,
        matchChildren: false,
      },
    ],
  },
];

export function SidebarDoctor() {
  return <SidebarBase menuGroups={doctorMenuGroups} />;
}

export default SidebarDoctor;
