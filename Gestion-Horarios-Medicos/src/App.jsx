import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import DoctorPanel from "./pages/DoctorPanel.jsx";
import SecretariaPanel from "./pages/SecretariaPanel.jsx";
import AgendarConsulta from "./pages/AgendarConsulta";
import "./styles.css";

// Rutas protegidas por rol
function PrivateRoute({ children, role }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  return isLoggedIn === role ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <AdminPanel />
          </PrivateRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <PrivateRoute role="doctor">
            <DoctorPanel />
          </PrivateRoute>
        }
      />
      <Route
        path="/secretaria"
        element={
          <PrivateRoute role="secretaria">
            <SecretariaPanel />
          </PrivateRoute>
        }
      />
      {/* IMPORTANTE: agrega tu ruta extra aquí */}
      <Route path="/admin/agendar" element={<AgendarConsulta />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
