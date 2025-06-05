import TextField from "@mui/material/TextField";
import fondo from "../assets/fondo.jpg";
import "../styles.css";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";

function Login() {
  const [showReset, setShowReset] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

            <form className="login-form">
              <div>
                <label htmlFor="email" className="login-label">
                  Correo:
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value="admin@admin.com"
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
                    className="login-input login-input-password"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" className="login-button">
                Login
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => setShowReset(true)}
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
                  className="login-input"
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
                  className="login-input"
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
                onClick={() => setShowReset(false)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                ← Volver al inicio
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
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

      <div className="absolute bottom-10 right-10 opacity-20">
        <svg
          className="w-16 h-16 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 8h2v8H4V8zm4-2h2v12H8V6zm4 4h2v8h-2v-8z" />
        </svg>
      </div>
    </motion.div>
  );
}

export default Login;
