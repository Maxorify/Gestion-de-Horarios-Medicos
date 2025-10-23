import { createBrowserRouter, Navigate } from "react-router-dom";

import RequireRole from "./guards/RequireRole.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import SecretariaLayout from "./layouts/SecretariaLayout.jsx";

import Login from "@/features/auth/pages/Login.jsx";
import CambioPasswordInicial from "@/features/auth/pages/CambioPasswordInicial.jsx";
import AdminPanel from "@/features/auth/pages/AdminPanel.jsx";
import DoctorPanel from "@/features/auth/pages/DoctorPanel.jsx";
import SecretariaPanel from "@/features/auth/pages/SecretariaPanel.jsx";
import AgendarConsulta from "@/features/pacientes/pages/AgendarConsulta.jsx";
import MisCitas from "@/features/pacientes/pages/MisCitas.jsx";
import SeleccionarHorarioDoctor from "@/features/agenda/pages/SeleccionarHorarioDoctor.jsx";
import CheckInPacientes from "@/features/agenda/pages/CheckInPacientes.jsx";
import CajaPagos from "@/features/secretaria/pages/CajaPagos.jsx";
import DoctoresAdmin from "@/features/doctores/pages/DoctoresAdmin.jsx";
import AsignarHorarios from "@/features/horarios/pages/AsignarHorarios.jsx";
import MarcarAsistencia from "@/features/asistencias/pages/MarcarAsistencia.jsx";
import UsuariosSistemaPlaceholder from "@/features/usuarios/pages/UsuariosSistemaPlaceholder.jsx";

const adminChildren = [
  { index: true, element: <AdminPanel /> },
  { path: "doctores", element: <DoctoresAdmin /> },
  { path: "asignar-horarios", element: <AsignarHorarios /> },
  { path: "asistencias", element: <div>Registro de Asistencia (placeholder)</div> },
  {
    path: "agendar",
    element: <AgendarConsulta />,
  },
  {
    path: "agendar/seleccionar-horario",
    element: <SeleccionarHorarioDoctor />,
  },
  { path: "mis-citas", element: <MisCitas /> },
  { path: "usuarios", element: <UsuariosSistemaPlaceholder /> },
  { path: "reportes-asistencia", element: <div>Reportes de Asistencia (placeholder)</div> },
  { path: "configuracion", element: <div>Ajustes del sistema (placeholder)</div> },
  { path: "soporte", element: <div>Soporte y Ayuda (placeholder)</div> },
  { path: "pacientes", element: <div>Pacientes (placeholder)</div> },
  { path: "*", element: <Navigate to="/admin" replace /> },
];

const secretariaChildren = [
  { index: true, element: <SecretariaPanel /> },
  { path: "check-in", element: <CheckInPacientes /> },
  { path: "agendar", element: <AgendarConsulta /> },
  { path: "caja", element: <CajaPagos /> },
  { path: "asistencias", element: <MarcarAsistencia /> },
  { path: "mis-citas", element: <MisCitas /> },
  { path: "*", element: <Navigate to="/secretaria" replace /> },
];

export const router = createBrowserRouter(
  [
    { path: "/", element: <Navigate to="/login" replace /> },
    { path: "/login", element: <Login /> },
    { path: "/cambio-password", element: <CambioPasswordInicial /> },
    {
      path: "/admin",
      element: (
        <RequireRole roles={["administrador"]}>
          <AdminLayout />
        </RequireRole>
      ),
      children: adminChildren,
    },
    {
      path: "/secretaria",
      element: (
        <RequireRole roles={["secretaria", "administrador"]}>
          <SecretariaLayout />
        </RequireRole>
      ),
      children: secretariaChildren,
    },
    {
      path: "/doctor",
      element: (
        <RequireRole roles={["doctor"]}>
          <DoctorPanel />
        </RequireRole>
      ),
    },
    { path: "*", element: <Navigate to="/login" replace /> },
  ],
  {
    future: { v7_startTransition: true },
  }
);
