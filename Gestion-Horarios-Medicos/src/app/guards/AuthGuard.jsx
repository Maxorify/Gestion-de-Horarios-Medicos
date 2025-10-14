// src/app/guards/AuthGuard.jsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export default function AuthGuard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => sub?.subscription?.unsubscribe();
  }, []);

  if (loading) return null;
  if (!session)
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
