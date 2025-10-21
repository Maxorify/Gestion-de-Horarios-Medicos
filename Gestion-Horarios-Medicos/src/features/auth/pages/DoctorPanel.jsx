import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function DoctorLayout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
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