// src/app/guards/AuthGuard.jsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export default function AuthGuard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        if (!mounted) return;
        setSession(data?.session ?? null);
      } catch (error) {
        console.error("// CODEx: Error al obtener la sesión activa en AuthGuard", error);
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.error("// CODEx: Error al forzar el cierre de sesión desde AuthGuard", signOutError);
        }
        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setLoading(true);
      try {
        setSession(nextSession ?? null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) return null;
  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
