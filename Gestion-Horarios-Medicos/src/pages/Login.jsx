import fondo from "../assets/fondo.jpg";
import "../styles.css";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

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

function Login() {
  // Estados para login y reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const tipoUsuario = localStorage.getItem("isLoggedIn");
    if (tipoUsuario === "admin") navigate("/admin");
    else if (tipoUsuario === "doctor") navigate("/doctor");
    else if (tipoUsuario === "secretaria") navigate("/secretaria");
  }, [navigate]);

  const mockUsers = [
    { email: "admin@admin.com", password: "1234", type: "admin" },
    { email: "doctor@admin.com", password: "doctor123", type: "doctor" },
    { email: "secretaria@admin.com", password: "sec123", type: "secretaria" },
  ];

  // Handler para login
  const handleLogin = (e) => {
    e.preventDefault();
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      setLoginError("");
      setEmail("");
      setPassword("");
      localStorage.setItem("isLoggedIn", user.type); // <<--- AQUÍ
      if (user.type === "admin") navigate("/admin");
      else if (user.type === "doctor") navigate("/doctor");
      else if (user.type === "secretaria") navigate("/secretaria");
    } else {
      setLoginError("Credenciales inválidas");
    }
  };

  // Handler para reset de password
  const handleReset = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }
    setPasswordError("");
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowReset(false);
      setPassword("");
      setConfirmPassword("");
    }, 2000);
  };

  // Al cambiar de vista, limpia errores/campos
  const goToReset = () => {
    setShowReset(true);
    setLoginError("");
    setEmail("");
    setPassword("");
  };

  const goToLogin = () => {
    setShowReset(false);
    setPasswordError("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <motion.div
      className="login-page"
      style={{ backgroundImage: `url(${fondo})` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${fondo})` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      <div className="absolute right-0 top-0 w-2/3 h-full opacity-30">
        <div className="w-full h-full bg-gradient-to-l from-blue-300 to-transparent"></div>
      </div>

      <ThemeProvider theme={loginTheme}>
        <CssBaseline />
        <AnimatePresence mode="wait">
          {!showReset ? (
            <motion.div
              key="login"
              className="login-container"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-center mb-6">
                Inicio de sesión
              </h2>

              <form className="login-form" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="email" className="login-label">
                    Correo:
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-input"
                      placeholder="correo@ejemplo.com"
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
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-input login-input-password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {loginError && (
                  <p className="text-red-500 text-sm mt-2">{loginError}</p>
                )}

                <button type="submit" className="login-button">
                  Login
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={goToReset}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  ¿No tienes cuenta?
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reset"
              className="login-container"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-center mb-6">
                Restablecer contraseña
              </h2>

              <form className="login-form" onSubmit={handleReset}>
                <div>
                  <label htmlFor="email" className="login-label">
                    Tu correo
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="login-input"
                    placeholder="correo@dominio.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="login-label">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    id="password"
                    className={`login-input ${
                      passwordError ? "border-red-500" : ""
                    }`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="login-label">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    className={`login-input ${
                      passwordError ? "border-red-500" : ""
                    }`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>
                <button type="submit" className="login-button">
                  Restablecer
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  onClick={goToLogin}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  ← Volver al inicio
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensaje de éxito */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white p-8 rounded-xl shadow-lg text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16 text-green-500 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 60 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
                <p className="text-lg font-semibold text-gray-700">
                  ¡Solicitud de contraseña enviada exitosamente!
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ThemeProvider>
    </motion.div>
  );
}

export default Login;
