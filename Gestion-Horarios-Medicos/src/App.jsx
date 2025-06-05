// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import DoctorPanel from "./pages/DoctorPanel.jsx";
import SecretariaPanel from "./pages/SecretariaPanel.jsx";
import "./styles.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/doctor" element={<DoctorPanel />} />
      <Route path="/secretaria" element={<SecretariaPanel />} />
      {/* Ruta catch-all por si la URL no existe */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
