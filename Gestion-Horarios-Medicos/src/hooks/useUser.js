// --- ARCHIVO: src/hooks/useUser.js ---
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { loginConEmailYPassword } from "@/services/auth";

const DEFAULT_ROLE = "secretaria";

function mapUserProfile(profile) {
  if (!profile) return null;

  const role = profile.rol ?? profile.role ?? DEFAULT_ROLE;

  return {
    ...profile,
    rol: role,
    role,
  };
}

async function fetchUserProfileById(userId) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*, personas(*)")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error("No se pudo obtener el perfil de usuario");
  }

  return data;
}

const UserContext = createContext(undefined);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncSession(session) {
      if (!isMounted) return;

      if (!session?.user?.id) {
        setUser(null);
        return;
      }

      const profile = await fetchUserProfileById(session.user.id);
      if (!isMounted) return;
      setUser(mapUserProfile(profile));
    }

    async function bootstrap() {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        await syncSession(data?.session ?? null);
      } catch (error) {
        console.error("Error al restaurar la sesión", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setLoading(true);
      try {
        await syncSession(session ?? null);
      } catch (error) {
        console.error("Error al sincronizar la sesión", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const profile = await loginConEmailYPassword(email, password);
      const mappedProfile = mapUserProfile(profile);
      setUser(mappedProfile);
      return mappedProfile;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
    } catch (error) {
      throw error instanceof Error ? error : new Error("Error al cerrar sesión");
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser debe utilizarse dentro de un UserProvider");
  }
  return context;
}
