// src/app/guards/RoleGuard.jsx
import { Outlet, Navigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";

const DEFAULT_ROLE = "secretaria";

export default function RoleGuard({ allow = [] }) {
  const { user, loading } = useUser();

  if (loading) {
    return null;
  }

  if (!user) {
    console.warn("// CODEx: No hay usuario activo, se redirige al login desde RoleGuard.");
    return <Navigate to="/" replace />;
  }

  const role = user.rol ?? user.role ?? DEFAULT_ROLE;

  if (!allow.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
