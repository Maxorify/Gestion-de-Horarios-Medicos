// src/app/guards/RoleGuard.jsx
import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export default function RoleGuard({ allow = [] }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }

      const { data: row } = await supabase
        .from("app_users")
        .select("role")
        .eq("user_id", uid)
        .single();

      if (mounted) {
        setRole(row?.role ?? "secretaria");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return null;
  if (!allow.includes(role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
