import { Outlet } from "react-router-dom";
import { SidebarSecretaria } from "@/components/SidebarSecretaria";
import { SidebarDoctor } from "@/components/SidebarDoctor";
import Topbar from "@/components/Topbar";
import { useUser } from "@/hooks/useUser";
import AdminLayout from "./AdminLayout.jsx";

function RoleSidebarShell({ SidebarComponent }) {
  return (
    <div className="min-h-screen flex">
      <SidebarComponent />
      <div className="flex-1 flex flex-col min-w-0">
        <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
          <Topbar />
        </div>
        <main className="p-4 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function SecretariaLayout() {
  const { user, loading } = useUser();
  const normalizedRole = (user?.rol ?? "").toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-4 text-sm text-gray-600 shadow-sm">
          Cargando panel de navegación...
        </div>
      </div>
    );
  }

  if (normalizedRole === "administrador") {
    return <AdminLayout />;
  }

  if (normalizedRole === "doctor") {
    return <RoleSidebarShell SidebarComponent={SidebarDoctor} />;
  }

  return <RoleSidebarShell SidebarComponent={SidebarSecretaria} />;
}
