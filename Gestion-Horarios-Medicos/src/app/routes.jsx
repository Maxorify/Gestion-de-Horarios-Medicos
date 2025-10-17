// src/app/routes.jsx
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

// Guards & Layouts
import AuthGuard from "./guards/AuthGuard.jsx";
import RoleGuard from "./guards/RoleGuard.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import SecretariaLayout from "./layouts/SecretariaLayout.jsx";

// Pages
import Login from "@/features/auth/pages/Login.jsx";
import AdminPanel from "@/features/auth/pages/AdminPanel.jsx";
import DoctorPanel from "@/features/auth/pages/DoctorPanel.jsx";
import SecretariaPanel from "@/features/auth/pages/SecretariaPanel.jsx";
import AgendarConsulta from "@/features/pacientes/pages/AgendarConsulta.jsx";
import MisCitas from "@/features/pacientes/pages/MisCitas.jsx";
import SeleccionarHorarioDoctor from "@/features/agenda/pages/SeleccionarHorarioDoctor.jsx";
import DoctoresAdmin from "@/features/doctores/pages/DoctoresAdmin.jsx";
import AsignarHorarios from "@/features/horarios/pages/AsignarHorarios.jsx";

export const router = createBrowserRouter(
  [
    // Público
    { path: "/", element: <Login /> },

    // Protegido
    {
      element: <AuthGuard />,
      children: [
        // ADMIN
        {
          element: <RoleGuard allow={["adminisntrador"]} />,
          children: [
            {
              path: "/admin",
              element: <AdminLayout />,
              children: [
                { index: true, element: <AdminPanel /> },
                { path: "doctores", element: <DoctoresAdmin /> },
                {
                  path: "asignar-horarios",
                  element: <AsignarHorarios />,
                },
                {
                  path: "asistencias",
                  element: <div>Registro de Asistencia (placeholder)</div>,
                },
                {
                  path: "agendar",
                  element: <Outlet />,
                  children: [
                    { index: true, element: <AgendarConsulta /> },
                    {
                      path: "seleccionar-horario",
                      element: <SeleccionarHorarioDoctor />,
                    },
                  ],
                },
                { path: "mis-citas", element: <MisCitas /> },
                {
                  path: "reportes-asistencia",
                  element: <div>Reportes de Asistencia (placeholder)</div>,
                },
                {
                  path: "configuracion",
                  element: <div>Ajustes del sistema (placeholder)</div>,
                },
                {
                  path: "soporte",
                  element: <div>Soporte y Ayuda (placeholder)</div>,
                },
                {
                  path: "pacientes",
                  element: <div>Pacientes (placeholder)</div>,
                },
                { path: "*", element: <Navigate to="/admin" replace /> },
              ],
            },
          ],
        },

        // SECRETARÍA
        {
          element: <RoleGuard allow={["secretaria"]} />,
          children: [
            {
              path: "/sec",
              element: <SecretariaLayout />,
              children: [
                { index: true, element: <SecretariaPanel /> },
                { path: "doctores", element: <DoctorPanel /> },
                {
                  path: "asignar-horarios",
                  element: <div>Asignar Horarios (placeholder)</div>,
                },
                {
                  path: "asistencias",
                  element: <div>Registro de Asistencia (placeholder)</div>,
                },
                { path: "agendar", element: <AgendarConsulta /> },
                { path: "mis-citas", element: <MisCitas /> },
                {
                  path: "reportes-asistencia",
                  element: <div>Reportes de Asistencia (placeholder)</div>,
                },
                {
                  path: "configuracion",
                  element: <div>Ajustes del sistema (placeholder)</div>,
                },
                {
                  path: "soporte",
                  element: <div>Soporte y Ayuda (placeholder)</div>,
                },
                {
                  path: "pacientes",
                  element: <div>Pacientes (placeholder)</div>,
                },
                { path: "*", element: <Navigate to="/sec" replace /> },
              ],
            },
          ],
        },

        // DOCTOR
        {
          element: <RoleGuard allow={["doctor"]} />,
          children: [{ path: "/doctor", element: <DoctorPanel /> }],
        },
      ],
    },

    // Fallback global
    { path: "*", element: <Navigate to="/" replace /> },
  ],
  {
    future: { v7_startTransition: true },
  }
);
