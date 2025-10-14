// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";

// 👇 Importa los estilos base de Tailwind y los estilos personalizados
import "./index.css";
import "./styles.css";

import App from "./App";
import { ColorModeContext, useMode } from "./theme";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const Main = () => {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <App />
        </LocalizationProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
