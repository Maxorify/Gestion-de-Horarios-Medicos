import React from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../scenes/global/Topbar"; // ajusta la ruta si es necesario

function AdminPanel() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  return (
    <div>
      <Topbar />
      <div style={{ padding: 24 }}>
        <h1>Bienvenido Admin</h1>
        {/* Botón para cerrar sesión */}
        <button
          onClick={handleLogout}
          style={{ marginTop: 16, padding: "8px 20px" }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default AdminPanel;
