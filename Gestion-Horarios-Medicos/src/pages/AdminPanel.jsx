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
      </div>
    </div>
  );
}

export default AdminPanel;
