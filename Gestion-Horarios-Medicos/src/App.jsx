import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import DoctorPanel from "./pages/DoctorPanel.jsx";
import SecretariaPanel from "./pages/SecretariaPanel.jsx";
import "./styles.css";

// 1. Aquí defines tu PrivateRoute:
function PrivateRoute({ children, role }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  // Si está logeado y su rol coincide, deja pasar:
  if (isLoggedIn === role) {
    return children;
  } else {
    // Si no, lo manda al login
    return <Navigate to="/" />;
  }
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
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
