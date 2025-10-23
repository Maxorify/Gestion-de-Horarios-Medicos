import { useEffect, useMemo, useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, Typography, useTheme, IconButton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";

import { tokens } from "../theme";
import { useUser } from "@/hooks/useUser";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";

const Item = ({ title, to, icon, isActive, isCollapsed, colors }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) navigate(to);
  };

  const isLight = theme.palette.mode === "light";
  const itemColor = isLight ? colors.grey[700] : colors.grey[100];
  const activeColor = isLight ? colors.blueAccent[600] : colors.blueAccent[300];
  const currentColor = isActive ? activeColor : itemColor;

  return (
    <MenuItem
      active={isActive}
      style={{
        color: currentColor,
        transition: "color 0.3s ease",
        fontWeight: isActive ? "bold" : "normal",
        borderRadius: "18px",
        margin: isCollapsed ? "8px 0" : "3px 0",
        padding: isCollapsed ? "2px 0" : "0",
      }}
      onClick={handleClick}
      icon={icon}
      sx={{
        "&:hover": {
          backgroundColor: isLight
            ? alpha(colors.blueAccent[100], 0.35)
            : alpha(colors.primary[400], 0.38),
          color: isLight ? colors.grey[900] : colors.blueAccent[200],
          borderRadius: "18px",
        },
      }}
    >
      {!isCollapsed && <Typography>{title}</Typography>}
    </MenuItem>
  );
};

export function SidebarBase({ menuGroups = [] }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const { pathname } = useLocation();

  const resolveIsActive = (to, { matchChildren = true } = {}) =>
    matchChildren ? pathname === to || pathname.startsWith(`${to}/`) : pathname === to;

  const { user } = useUser();
  const persona = user?.persona ?? null;

  const profile = useMemo(() => {
    const displayName = persona
      ? [persona.nombre, persona.apellido_paterno, persona.apellido_materno]
          .filter(Boolean)
          .join(" ")
      : user?.email ?? "Usuario";

    const displayEmail = persona?.email ?? user?.email ?? "";

    const avatarSeed = persona?.rut || displayEmail || displayName || "usuario";

    return { displayName, displayEmail, avatarSeed };
  }, [persona, user?.email]);

  const handleMouseEnter = () => {
    if (!isPinned) setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    if (!isPinned) setIsCollapsed(true);
  };

  const togglePin = () => {
    setIsPinned((pinned) => !pinned);
    setIsCollapsed((prev) => (isPinned ? true : false));
  };

  const isLight = theme.palette.mode === "light";
  const sidebarBg = isLight ? colors.primary[100] : colors.primary[600];
  const textPrimary = isLight ? colors.grey[900] : colors.grey[100];
  const textSecondary = isLight ? colors.grey[700] : colors.grey[300];
  const borderColor = isLight ? colors.grey[300] : colors.primary[700];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--scrollbar-thumb",
      isLight ? colors.grey[400] : colors.primary[400]
    );
    root.style.setProperty(
      "--scrollbar-track",
      isLight ? colors.primary[100] : colors.primary[800]
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
          scrollbarColor: `${isLight ? colors.grey[400] : colors.primary[400]} ${sidebarBg}`,
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--scrollbar-thumb)",
            borderRadius: "3px",
          },
          boxShadow: isLight
            ? `2px 0 8px ${alpha(colors.grey[900], 0.08)}`
            : `2px 0 12px ${alpha(colors.primary[900], 0.65)}`,
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
            ? `${alpha(colors.blueAccent[100], 0.4)} !important`
            : `${alpha(colors.primary[400], 0.45)} !important`,
          color: isLight
            ? `${colors.grey[900]} !important`
            : `${colors.blueAccent[200]} !important`,
          borderRadius: "18px",
        },
        "& .pro-menu-item.active": {
          color: `${activeColor} !important`,
          backgroundColor: isLight
            ? `${alpha(colors.blueAccent[200], 0.45)} !important`
            : `${alpha(colors.blueAccent[700], 0.55)} !important`,
          borderRadius: "18px",
        },
        "& .pro-menu-item.active .pro-icon-wrapper": {
          color: `${activeColor} !important`,
        },
      }}
      className="custom-scrollbar"
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
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
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                }}
              >
                <Tooltip title={isPinned ? "Desfijar sidebar" : "Fijar sidebar"}>
                  <IconButton
                    onClick={togglePin}
                    size="small"
                    sx={{
                      color: isPinned ? activeColor : textSecondary,
                      "&:hover": {
                        color: activeColor,
                        backgroundColor: isLight
                          ? alpha(colors.blueAccent[100], 0.45)
                          : alpha(colors.primary[400], 0.5),
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
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
                  profile.avatarSeed
                )}`}
                alt="avatar"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  marginBottom: 8,
                  background: isLight ? colors.blueAccent[100] : colors.blueAccent[700],
                  border: `2px solid ${borderColor}`,
                }}
              />
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color={textPrimary}
                align="center"
              >
                {profile.displayName}
              </Typography>
              {profile.displayEmail && (
                <Typography
                  variant="caption"
                  color={textSecondary}
                  align="center"
                  sx={{ fontSize: 12 }}
                >
                  {profile.displayEmail}
                </Typography>
              )}
            </Box>
          )}

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
            {menuGroups.map((group, index) => (
              <Box key={group.heading ?? `group-${index}`} sx={{ width: "100%" }}>
                {group.heading && !isCollapsed && (
                  <Typography
                  variant="h6"
                    color={isLight ? colors.grey[800] : colors.grey[100]}
                    sx={{
                      m: "15px 0 5px 20px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                    }}
                  >
                    {group.heading}
                  </Typography>
                )}
                {group.items.map((item) => (
                  <Item
                    key={item.to ?? item.title}
                    title={item.title}
                    to={item.to}
                    icon={item.icon}
                    isActive={item.to ? resolveIsActive(item.to, {
                      matchChildren: item.matchChildren ?? true,
                    }) : false}
                    isCollapsed={isCollapsed}
                    colors={colors}
                  />
                ))}
              </Box>
            ))}
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
}

export default SidebarBase;
