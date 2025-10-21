import { Navigate, Outlet, useLocation } from "react-router-dom";
import * as authLocal from "@/services/authLocal";

export default function RequireRole({ roles = [], children }) {
  const location = useLocation();
  const session = authLocal.getSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const normalizedRole = (session.rol ?? "").toLowerCase();
  const allowed = roles.map((role) => (role ?? "").toLowerCase());

  if (allowed.length > 0 && !allowed.includes(normalizedRole)) {
    const fallback =
      normalizedRole === "administrador"
        ? "/admin"
        : normalizedRole === "secretaria"
        ? "/sec"
        : normalizedRole === "doctor"
        ? "/doctor"
        : "/";
    return <Navigate to={fallback} replace />;
  }

  if (children) {
    return children;
  }

  return <Outlet />;
}
