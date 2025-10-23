import { Outlet } from "react-router-dom";
import { SidebarSecretaria } from "@/components/SidebarSecretaria";
import Topbar from "@/components/Topbar";

export default function SecretariaLayout() {
  return (
    <div className="min-h-screen flex">
      <SidebarSecretaria />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-4 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
