import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import { motion } from "framer-motion";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import fondo from "@/assets/fondo.jpg";
import "@/styles.css";
import { activarContrasenaInicial, minPasswordOk } from "@/services/authLocal";

const MotionDiv = motion.div;

const pageTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      paper: "#fff",
      default: "transparent",
    },
    text: {
      primary: "#222",
    },
  },
});

function CambioPasswordInicial() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location?.state ?? {};
  const usuarioId = state?.usuario_id ?? null;
  const emailFromState = state?.email ?? "";

  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = emailFromState;

  useEffect(() => {
    if (!usuarioId) {
      navigate("/login", { replace: true });
    }
  }, [usuarioId, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!usuarioId) return;
    setFormError("");
    setSuccessMessage("");

    if (!minPasswordOk(nueva)) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (nueva !== confirmar) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      await activarContrasenaInicial(usuarioId, nueva);
      setSuccessMessage("Contraseña actualizada. Vuelve a iniciar sesión.");
      setNueva("");
      setConfirmar("");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "No se pudo actualizar la contraseña. Intenta nuevamente.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    navigate("/login", { replace: true });
  };

  return (
    <MotionDiv
      className="login-page"
      style={{ backgroundImage: `url(${fondo})` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MotionDiv
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${fondo})` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      <div className="absolute right-0 top-0 w-2/3 h-full opacity-30">
        <div className="w-full h-full bg-gradient-to-l from-blue-300 to-transparent" />
      </div>

      <ThemeProvider theme={pageTheme}>
        <CssBaseline />
        <MotionDiv
          className="login-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-center mb-6">Cambio de contraseña inicial</h2>
          {email && (
            <p className="text-center text-sm text-gray-600 mb-4">
              Actualiza la contraseña para <strong>{email}</strong> y accede a tu cuenta.
            </p>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="nueva" className="login-label">
                Nueva contraseña:
              </label>
              <div className="relative">
                <input
                  id="nueva"
                  type={mostrarNueva ? "text" : "password"}
                  value={nueva}
                  onChange={(event) => setNueva(event.target.value)}
                  className="login-input login-input-password"
                  placeholder="••••••••"
                  disabled={isSubmitting || !!successMessage}
                  required
                />
                <IconButton
                  type="button"
                  onClick={() => setMostrarNueva((prev) => !prev)}
                  size="small"
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(0, 0, 0, 0.54)",
                  }}
                  tabIndex={-1}
                >
                  {mostrarNueva ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </IconButton>
              </div>
            </div>

            <div>
              <label htmlFor="confirmar" className="login-label">
                Confirmar contraseña:
              </label>
              <div className="relative">
                <input
                  id="confirmar"
                  type={mostrarConfirmar ? "text" : "password"}
                  value={confirmar}
                  onChange={(event) => setConfirmar(event.target.value)}
                  className="login-input login-input-password"
                  placeholder="••••••••"
                  disabled={isSubmitting || !!successMessage}
                  required
                />
                <IconButton
                  type="button"
                  onClick={() => setMostrarConfirmar((prev) => !prev)}
                  size="small"
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(0, 0, 0, 0.54)",
                  }}
                  tabIndex={-1}
                >
                  {mostrarConfirmar ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </IconButton>
              </div>
            </div>

            {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
            {successMessage && <p className="text-green-600 text-sm mt-2">{successMessage}</p>}

            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting || !!successMessage}
            >
              {isSubmitting ? "Guardando..." : "Guardar y activar cuenta"}
            </button>
          </form>

          {successMessage && (
            <button type="button" className="login-button mt-4" onClick={goToLogin}>
              Ir a iniciar sesión
            </button>
          )}
        </MotionDiv>
      </ThemeProvider>
    </MotionDiv>
  );
}

export default CambioPasswordInicial;
