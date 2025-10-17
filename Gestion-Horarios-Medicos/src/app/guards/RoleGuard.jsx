import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@/hooks/useUser";

export default function RoleGuard({ allow = [] }) {
  const { user, loading } = useUser();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  const role = (user.rol ?? user.role ?? "secretaria").toLowerCase();
  const hasAccess = allow.includes(role);

  if (!hasAccess) {
    const redirect = role === "administrador" ? "/admin"
                    : role === "secretaria"     ? "/sec"
                    : role === "doctor"         ? "/doctor"
                    : "/";
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}
