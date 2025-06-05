import React from "react";
import TextField from "@mui/material/TextField";
import fondo from "../assets/fondo.jpg";
import "../styles.css";

//import './Login.css';

function Login() {
  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `url(${fondo})`,
      }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${fondo})` }}
      ></div>

      <div className="absolute right-0 top-0 w-2/3 h-full opacity-30">
        <div className="w-full h-full bg-gradient-to-l from-blue-300 to-transparent"></div>
      </div>
      <div className="login-container">
        <div className="text-center mb-8">
          <div className="inline-block border-2 border-gray-800 rounded-full px-6 py-2">
            <span className="text-gray-800 font-semibold text-lg">
              logo empresa
            </span>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
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
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
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
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" className="login-button">
            Login
          </button>
        </form>

        <div className="text-center mt-6">
          <a
            href="#"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            ¿No tienes cuenta?
          </a>
        </div>
      </div>
      <div className="absolute bottom-10 right-10 opacity-20">
        <svg
          className="w-16 h-16 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 8h2v8H4V8zm4-2h2v12H8V6zm4 4h2v8h-2v-8z" />
        </svg>
      </div>
    </div>
  );
}
export default Login;
