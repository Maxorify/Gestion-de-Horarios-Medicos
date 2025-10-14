// src/features/auth/hooks.js
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsub = null;

    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user || null;

      if (!authUser) {
        if (mounted) { setUser(null); setLoading(false); }
        return;
      }

      // Tu tabla buena es app_users, y la PK es user_id
      const { data, error, status } = await supabase
        .from("app_users")
        .select("user_id, role, email")
        .eq("user_id", authUser.id)
        .single();

      if (error && status === 404) {
        // No hay fila en app_users para este usuario. Evita el loop infinito de 404.
        console.warn("No existe fila en app_users para el usuario:", authUser.id);
        if (mounted) {
          setUser({
            id: authUser.id,
            email: authUser.email ?? "",
            role: "secretaria",   // o el default que quieras para seguir probando
            name: authUser.user_metadata?.full_name ?? "",
          });
          setLoading(false);
        }
        return;
      }

      if (!error && mounted) {
        setUser({
          id: authUser.id,
          email: authUser.email ?? "",
          role: data?.role ?? "secretaria",
          name: data?.display_name ?? "",
        });
      }

      if (mounted) setLoading(false);
    }

    fetchUser();
    const sub = supabase.auth.onAuthStateChange((_e, _s) => fetchUser());
    unsub = sub?.data?.subscription;

    return () => {
      mounted = false;
      unsub?.unsubscribe();
    };
  }, []);

  return { user, loading };
}
