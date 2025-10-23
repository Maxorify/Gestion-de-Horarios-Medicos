import { useMemo, useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, Typography, useTheme, IconButton, Tooltip } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";

import { tokens } from "../theme";
import { useUser } from "@/hooks/useUser";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import { alpha as muiAlpha } from "@mui/material/styles";

const Item = ({ title, to, icon, isActive, isCollapsed }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) navigate(to);
  };

  const isDark = theme.palette.mode === "dark";
  const accent = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const hoverBg = muiAlpha(accent, isDark ? 0.2 : 0.12);
  const activeBg = muiAlpha(accent, isDark ? 0.28 : 0.18);
  const currentColor = isActive ? accent : textPrimary;

  return (
    <MenuItem
      active={isActive}
      style={{
        color: currentColor,
        transition: "color 0.3s ease",
        fontWeight: isActive ? "600" : "500",
        borderRadius: "18px",
        margin: isCollapsed ? "8px 0" : "3px 0",
        padding: isCollapsed ? "2px 0" : "0",
      }}
      onClick={handleClick}
      icon={icon}
      sx={{
        "&:hover": {
          backgroundColor: `${hoverBg} !important`,
          color: `${textPrimary} !important`,
          borderRadius: "18px",
        },
        "&.active": {
          backgroundColor: `${activeBg} !important`,
          color: `${accent} !important`,
        },
        "& .pro-item-content": {
          color: textSecondary,
        },
      }}
    >
      {!isCollapsed && <Typography>{title}</Typography>}
    </MenuItem>
  );
};

export function SidebarBase({ menuGroups = [] }) {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const colors = tokens(mode);
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

  const isDark = mode === "dark";
  const sidebarBg = theme.palette.background.paper;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const borderColor = theme.palette.divider;
  const hoverBg = muiAlpha(theme.palette.primary.main, isDark ? 0.18 : 0.1);
  const activeColor = theme.palette.primary.main;
  const activeBg = muiAlpha(activeColor, isDark ? 0.25 : 0.18);
  const shadow = isDark
    ? "2px 0 14px rgba(3,7,18,0.45)"
    : "2px 0 14px rgba(15,23,42,0.08)";
  const pinActiveColor = theme.palette.primary.main;
  const pinHoverBg = muiAlpha(pinActiveColor, isDark ? 0.24 : 0.12);
  const avatarBg = isDark ? colors.blueAccent[700] : colors.blueAccent[100];
  const groupHeadingColor = isDark
    ? colors.grey[100]
    : theme.palette.text.primary;

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        height: "100vh",
        "& .pro-sidebar-inner": {
          background: `${sidebarBg} !important`,
          scrollbarWidth: "thin",
          scrollbarColor: `${theme.palette.divider} ${sidebarBg}`,
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--scrollbar-thumb)",
            borderRadius: "3px",
          },
          boxShadow: shadow,
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
          backgroundColor: `${hoverBg} !important`,
          color: `${textPrimary} !important`,
          borderRadius: "18px",
        },
        "& .pro-menu-item.active": {
          color: `${activeColor} !important`,
          backgroundColor: `${activeBg} !important`,
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
                      color: isPinned ? pinActiveColor : textSecondary,
                      "&:hover": {
                        color: pinActiveColor,
                        backgroundColor: pinHoverBg,
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
                  background: avatarBg,
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
                    color={groupHeadingColor}
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
