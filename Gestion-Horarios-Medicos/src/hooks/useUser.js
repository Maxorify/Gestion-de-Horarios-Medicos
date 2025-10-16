// src/hooks/useUser.js
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { loginConEmailYPassword } from "@/services/auth";

const DEFAULT_ROLE = "secretaria";

function mapUserProfile(profile) {
  if (!profile) return null;

  const resolvedRole = profile.rol ?? profile.role ?? DEFAULT_ROLE;

  return {
    ...profile,
    rol: resolvedRole,
    role: profile.role ?? resolvedRole,
  };
}

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user || null;

        if (!authUser) {
          if (mounted && isMountedRef.current) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("usuarios")
          .select("*, personas(*)")
          .eq("id", authUser.id)
          .single();

        if (!error && data && mounted && isMountedRef.current) {
          setUser(mapUserProfile(data));
        }

        if ((error || !data) && mounted && isMountedRef.current) {
          setUser(null);
        }
      } catch (_error) {
        if (mounted && isMountedRef.current) {
          setUser(null);
        }
      } finally {
        if (mounted && isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => fetchUser());

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      if (isMountedRef.current) setLoading(true);
      const profile = await loginConEmailYPassword(email, password);
      const mappedProfile = mapUserProfile(profile);

      if (isMountedRef.current) {
        setUser(mappedProfile);
      }

      return mappedProfile;
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : "Error al iniciar sesión";
      throw new Error(message);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  return { user, loading, login };
}
