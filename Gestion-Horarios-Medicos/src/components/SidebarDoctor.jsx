import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

import { SidebarBase } from "./SidebarBase";

const doctorMenuGroups = [
  {
    heading: null,
    items: [
      {
        title: "Panel del doctor",
        to: "/doctor",
        icon: <HomeOutlinedIcon />,
        matchChildren: false,
      },
    ],
  },
];

export function SidebarDoctor() {
  return <SidebarBase menuGroups={doctorMenuGroups} />;
}

export default SidebarDoctor;
