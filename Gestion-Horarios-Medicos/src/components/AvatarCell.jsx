import { Avatar, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

/**
 * Celda reutilizable para mostrar avatares en tablas.
 * Muestra una miniatura redonda de 32px o la inicial del nombre si no hay imagen.
 */
export default function AvatarCell({ name = "", avatarUrl = null }) {
  const theme = useTheme();
  const fallbackInitial = name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
      <Avatar
        src={avatarUrl || undefined}
        alt={name}
        sx={{
          width: 32,
          height: 32,
          fontSize: 14,
          bgcolor: avatarUrl ? undefined : theme.palette.primary.main,
          color: theme.palette.getContrastText(
            avatarUrl ? theme.palette.background.paper : theme.palette.primary.main,
          ),
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {fallbackInitial}
      </Avatar>
    </Box>
  );
}
