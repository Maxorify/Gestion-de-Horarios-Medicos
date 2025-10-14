// src/hooks/useUser.js
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user || null;

      if (!authUser) {
        if (mounted) { setUser(null); setLoading(false); }
        return;
      }

      const { data, error } = await supabase
        .from("app_users")
        .select("user_id, role, display_name, email, doctor_id")
        .eq("user_id", authUser.id)
        .single();

      if (!error && mounted) {
        setUser({
          id: authUser.id,
          email: data?.email ?? authUser.email ?? "",
          role: data?.role ?? "secretaria",
          name: data?.display_name ?? "",
          doctorId: data?.doctor_id ?? null,
        });
      }
      if (mounted) setLoading(false);
    }

    fetchUser();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, _s) => fetchUser());
    return () => { mounted = false; sub?.subscription?.unsubscribe(); };
  }, []);

  return { user, loading };
}
