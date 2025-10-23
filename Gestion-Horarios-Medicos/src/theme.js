import { ThemeProvider, CssBaseline } from "@mui/material";

import { createContext, useState, useMemo, useEffect } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens export
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#f7f8fb",
          200: "#e1e4ee",
          300: "#c9cee0",
          400: "#b0b7d1",
          500: "#969fbe",
          600: "#7681a1",
          700: "#586384",
          800: "#3b4665",
          900: "#1e2946",
        },
        primary: {
          100: "#dbe3ff",
          200: "#b4c5f1",
          300: "#8ca7e3",
          400: "#435882",
          500: "#161f36",
          600: "#121a2d",
          700: "#0d1423",
          800: "#090e19",
          900: "#05080f",
        },
        greenAccent: {
          100: "#d6f6eb",
          200: "#aeeed7",
          300: "#85e6c4",
          400: "#59deae",
          500: "#2dd699",
          600: "#22ab78",
          700: "#197f57",
          800: "#10543a",
          900: "#08291d",
        },
        redAccent: {
          100: "#fddedc",
          200: "#fbb1ad",
          300: "#f9837e",
          400: "#f65552",
          500: "#f32823",
          600: "#c21f1c",
          700: "#911715",
          800: "#610f0e",
          900: "#300807",
        },
        blueAccent: {
          100: "#dbe6ff",
          200: "#afcbff",
          300: "#83afff",
          400: "#5794ff",
          500: "#2b78ff",
          600: "#205dcc",
          700: "#164299",
          800: "#0d2f66",
          900: "#061a33",
        },
      }
    : {
        grey: {
          100: "#141414",
          200: "#292929",
          300: "#3d3d3d",
          400: "#525252",
          500: "#666666",
          600: "#858585",
          700: "#a3a3a3",
          800: "#c2c2c2",
          900: "#e0e0e0",
        },
        primary: {
          100: "#040509",
          200: "#080b12",
          300: "#0c101b",
          400: "#f2f0f0", // manually changed
          500: "#141b2d",
          600: "#1F2A40",
          700: "#727681",
          800: "#a1a4ab",
          900: "#d0d1d5",
        },
        greenAccent: {
          100: "#0f2922",
          200: "#1e5245",
          300: "#2e7c67",
          400: "#3da58a",
          500: "#4cceac",
          600: "#70d8bd",
          700: "#94e2cd",
          800: "#b7ebde",
          900: "#dbf5ee",
        },
        redAccent: {
          100: "#2c100f",
          200: "#58201e",
          300: "#832f2c",
          400: "#af3f3b",
          500: "#db4f4a",
          600: "#e2726e",
          700: "#e99592",
          800: "#f1b9b7",
          900: "#f8dcdb",
        },
        blueAccent: {
          100: "#151632",
          200: "#2a2d64",
          300: "#3e4396",
          400: "#535ac8",
          500: "#6870fa",
          600: "#868dfb",
          700: "#a4a9fc",
          800: "#c3c6fd",
          900: "#e1e2fe",
        },
      }),
});

// Ajustes de MUI theme
export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            // palette values for dark mode
            primary: {
              main: colors.blueAccent[400],
            },
            secondary: {
              main: colors.greenAccent[400],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: colors.primary[600],
              paper: colors.primary[500],
            },
            divider: colors.primary[400],
            text: {
              primary: colors.grey[100],
              secondary: colors.grey[400],
            },
          }
        : {
            // palette values for light mode
            primary: {
              main: colors.primary[100],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: "#fcfcfc",
              paper: "#ffffff",
            },
            divider: colors.grey[300],
            text: {
              primary: colors.grey[100],
              secondary: colors.grey[600],
            },
          }),
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 32,
      },
      h3: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 16,
      },
      h6: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 14,
      },
    },
  };
};

// context for color mode
export const ColorModeContext = createContext({
  mode: "light",
  toggleColorMode: () => {},
  setMode: () => {},
});

export const useMode = () => {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      setMode,
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [mode]
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};