// src/app/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

// Cambia a true si tu <Sidebar /> es position: fixed
const SIDEBAR_IS_FIXED = false;
const SIDEBAR_WIDTH = 260; // ajusta al ancho real de tu Sidebar

export default function AdminLayout() {
  const contentWrapperStyle = SIDEBAR_IS_FIXED
    ? {
        minHeight: "100vh",
        paddingLeft: SIDEBAR_WIDTH, // crea espacio para el sidebar fijo
        display: "flex",
        flexDirection: "column",
      }
    : {
        minHeight: "100vh",
        display: "flex",
      };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Sidebar a la izquierda */}
      {SIDEBAR_IS_FIXED ? (
        <>
          <Sidebar />
          <div style={contentWrapperStyle}>
            <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
              <Topbar />
            </div>
            <main style={{ flex: 1, overflow: "auto" }}>
              <Outlet />
            </main>
          </div>
        </>
      ) : (
        <div style={contentWrapperStyle}>
          <Sidebar />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
              <Topbar />
            </div>
            <main style={{ flex: 1, overflow: "auto" }}>
              <Outlet />
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
