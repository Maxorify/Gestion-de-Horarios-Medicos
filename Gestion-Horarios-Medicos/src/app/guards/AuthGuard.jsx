// src/app/guards/AuthGuard.jsx
import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/services/supabaseClient";

export default function AuthGuard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const synchronizeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!mounted) return;

        const nextSession = data?.session ?? null;
        setSession(nextSession);
      } catch (error) {
        console.error(
          "// CODEx: Error al obtener la sesión activa en AuthGuard",
          error
        );
        wasAuthenticatedRef.current = false;
        if (mounted) {
          setSession(null);
        }
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error(
            "// CODEx: Error al forzar el cierre de sesión desde AuthGuard",
            signOutError
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    synchronizeSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      wasAuthenticatedRef.current = true;
      return;
    }

    if (!loading && wasAuthenticatedRef.current) {
      wasAuthenticatedRef.current = false;
      supabase.auth
        .signOut()
        .catch((error) =>
          console.error(
            "// CODEx: Error al cerrar sesión tras expirar la sesión",
            error
          )
        );
    }
  }, [loading, session]);

  if (loading) return null;
  if (!session) return <Navigate to="/" replace />;
  return <Outlet />;
}
