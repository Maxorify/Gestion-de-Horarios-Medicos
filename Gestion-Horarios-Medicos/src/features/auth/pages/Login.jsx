import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { motion } from "framer-motion";

import fondo from "@/assets/fondo.jpg";
import "@/styles.css";
import { useUser } from "@/hooks/useUser";

const loginTheme = createTheme({
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

const MotionDiv = motion.div;
const DEFAULT_ROLE = "secretaria";

function Login() {
  const navigate = useNavigate();
  const { user, loading: userLoading, login } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userLoading || !user) return;

    const role = (user.rol ?? DEFAULT_ROLE).toLowerCase();
    const destination =
      role === "administrador"
        ? "/admin"
        : role === "secretaria"
        ? "/secretaria"
        : "/doctor";

    navigate(destination, { replace: true });
  }, [user, userLoading, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result?.pending) {
        navigate("/cambio-password", {
          state: { usuario_id: result.usuario_id, email: result.email },
          replace: true,
        });
        return;
      }
      setEmail("");
      setPassword("");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Credenciales inválidas o usuario inactivo";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
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

      <ThemeProvider theme={loginTheme}>
        <CssBaseline />
        <MotionDiv
          className="login-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-center mb-6">Inicio de sesión</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="login-label">
                Correo:
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="login-input"
                  placeholder="correo@ejemplo.com"
                  disabled={isSubmitting || userLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="login-label">
                Contraseña:
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="login-input login-input-password"
                  placeholder="••••••••"
                  disabled={isSubmitting || userLoading}
                  required
                />
              </div>
            </div>

            {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}

            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting || userLoading}
            >
              {isSubmitting || userLoading ? "Ingresando..." : "Login"}
            </button>
          </form>
        </MotionDiv>
      </ThemeProvider>
    </MotionDiv>
  );
}

export default Login;
