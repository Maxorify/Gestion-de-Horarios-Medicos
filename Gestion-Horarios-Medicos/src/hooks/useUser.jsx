import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/services/supabaseClient";
import * as authLocal from "@/services/authLocal";

const INITIAL_STATE = {
  user: null,
  loading: true,
  error: null,
};

const PERSONA_COLUMNS = [
  "id",
  "nombre",
  "apellido_paterno",
  "apellido_materno",
  "rut",
  "email",
  "telefono_principal",
  "telefono_secundario",
  "direccion",
];

async function obtenerPersona(personaId) {
  if (!personaId) {
    throw new Error("La sesión no tiene una persona asociada");
  }
  const { data, error } = await supabase
    .from("personas")
    .select(PERSONA_COLUMNS.join(", "))
    .eq("id", personaId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("La persona asociada no existe o fue eliminada");
  }

  return data;
}

async function obtenerDoctorOpcional(personaId) {
  if (!personaId) return null;
  const { data, error } = await supabase
    .from("doctores")
    .select("id")
    .eq("persona_id", personaId)
    .neq("estado", "inactivo")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

const UserContext = createContext({
  ...INITIAL_STATE,
  login: async () => undefined,
  logout: () => undefined,
  refresh: async () => undefined,
});

export function UserProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);

  const construirUsuario = useCallback(async (sessionPayload) => {
    if (!sessionPayload) return null;
    const persona = await obtenerPersona(sessionPayload.persona_id);
    const doctor = await obtenerDoctorOpcional(sessionPayload.persona_id);
    return {
      usuario_id: sessionPayload.usuario_id,
      persona_id: sessionPayload.persona_id,
      rol: sessionPayload.rol,
      email: sessionPayload.email,
      persona,
      doctor_id: doctor?.id ?? null,
      doctor,
    };
  }, []);

  const sincronizarDesdeSesion = useCallback(
    async (sessionPayload) => {
      if (!sessionPayload) {
        setState({ user: null, loading: false, error: null });
        return null;
      }
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const user = await construirUsuario(sessionPayload);
        setState({ user, loading: false, error: null });
        return user;
      } catch (error) {
        console.error("No se pudo construir el usuario desde la sesión", error);
        authLocal.logout();
        setState({ user: null, loading: false, error: error instanceof Error ? error : new Error("No se pudo obtener la información del usuario") });
        return null;
      }
    },
    [construirUsuario]
  );

  const bootstrap = useCallback(async () => {
    const session = authLocal.getSession();
    await sincronizarDesdeSesion(session);
  }, [sincronizarDesdeSesion]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email, password) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const session = await authLocal.login(email, password);
        if (session?.pending) {
          setState({ user: null, loading: false, error: null });
          return session;
        }
        return await sincronizarDesdeSesion(session);
      } catch (error) {
        const normalized =
          error instanceof Error
            ? error
            : new Error("No se pudo iniciar sesión, inténtalo nuevamente");
        setState({ user: null, loading: false, error: normalized });
        throw normalized;
      }
    },
    [sincronizarDesdeSesion]
  );

  const logout = useCallback(() => {
    authLocal.logout();
    setState({ user: null, loading: false, error: null });
  }, []);

  const refresh = useCallback(async () => {
    const session = authLocal.getSession();
    return sincronizarDesdeSesion(session);
  }, [sincronizarDesdeSesion]);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      refresh,
    }),
    [login, logout, refresh, state]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe utilizarse dentro de un UserProvider");
  }
  return context;
}
