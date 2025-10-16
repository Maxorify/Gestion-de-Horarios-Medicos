import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { supabase } from "@/services/supabaseClient";
import { loginConEmailYPassword, obtenerPerfilUsuarioPorEmail } from "@/services/auth";

const DEFAULT_ROLE = "secretaria";
const INITIAL_STATE = {
  user: null,
  perfil: null,
  loading: true,
  error: null
};

function normalizarDato(obj) {
  if (!obj) return null;
  if (Array.isArray(obj)) {
    return obj[0] ?? null;
  }
  return obj;
}

function mapUserProfile(profile) {
  if (!profile) return null;

  const persona = profile.personas ?? profile.persona ?? null;
  const personaId = profile.persona_id ?? persona?.id ?? profile.idPersona ?? null;
  const doctorInfo = normalizarDato(profile.doctor ?? profile.doctores);
  const pacienteInfo = normalizarDato(profile.paciente ?? profile.pacientes);
  const rol = profile.rol ?? profile.role ?? DEFAULT_ROLE;

  const nombreCompleto = [persona?.nombre, persona?.apellido_paterno, persona?.apellido_materno]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: profile.id ?? profile.usuario_id ?? null,
    idUsuario: profile.id ?? profile.usuario_id ?? null,
    personaId,
    idPersona: personaId,
    persona: persona ?? null,
    nombre: persona?.nombre ?? null,
    apellidoPaterno: persona?.apellido_paterno ?? null,
    apellidoMaterno: persona?.apellido_materno ?? null,
    nombreCompleto,
    email: persona?.email ?? profile.email ?? null,
    rut: persona?.rut ?? profile.rut ?? null,
    telefono: persona?.telefono_principal ?? profile?.telefono_principal ?? null,
    telefonoPrincipal: persona?.telefono_principal ?? null,
    telefonoSecundario: persona?.telefono_secundario ?? null,
    estado: profile.estado ?? null,
    rol,
    role: rol,
    doctorId: doctorInfo?.id ?? profile.doctor_id ?? null,
    doctor: doctorInfo ?? null,
    pacienteId: pacienteInfo?.id ?? profile.paciente_id ?? null,
    paciente: pacienteInfo ?? null,
    authUserId: profile.auth_user_id ?? profile.authUserId ?? null
  };
}

const UserContext = createContext({
  ...INITIAL_STATE,
  login: async () => undefined,
  logout: async () => undefined,
  refreshPerfil: async () => undefined
});

function useIsMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}

export function UserProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);
  const isMountedRef = useIsMounted();

  const setSafeState = useCallback((updater) => {
    if (!isMountedRef.current) return;
    setState((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, [isMountedRef]);

  const handleProfileSuccess = useCallback((rawProfile) => {
    const mappedProfile = mapUserProfile(rawProfile);
    setSafeState({
      user: mappedProfile,
      perfil: mappedProfile,
      loading: false,
      error: null
    });
    return mappedProfile;
  }, [setSafeState]);

  const handleProfileError = useCallback((error) => {
    const normalizedError =
      error instanceof Error ? error : new Error("No se pudo recuperar la información del usuario");
    console.error("// CODEx: No se pudo sincronizar el perfil activo", normalizedError);
    setSafeState({
      user: null,
      perfil: null,
      loading: false,
      error: normalizedError
    });
    return normalizedError;
  }, [setSafeState]);

  const fetchPerfilForSessionUser = useCallback(async (sessionUser) => {
    if (!sessionUser?.email) {
      setSafeState({ user: null, perfil: null, loading: false, error: null });
      return null;
    }

    setSafeState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rawProfile = await obtenerPerfilUsuarioPorEmail(sessionUser.email);
      return handleProfileSuccess(rawProfile);
    } catch (error) {
      handleProfileError(error);
      return null;
    }
  }, [handleProfileError, handleProfileSuccess, setSafeState]);

  const refreshPerfil = useCallback(async () => {
    setSafeState((prev) => ({ ...prev, loading: true }));
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const sessionUser = data?.session?.user ?? null;
      if (!sessionUser) {
        setSafeState({ user: null, perfil: null, loading: false, error: null });
        return null;
      }
      return await fetchPerfilForSessionUser(sessionUser);
    } catch (error) {
      handleProfileError(error);
      return null;
    }
  }, [fetchPerfilForSessionUser, handleProfileError, setSafeState]);

  useEffect(() => {
    let isProcessing = true;

    const bootstrap = async () => {
      setSafeState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const sessionUser = data?.session?.user ?? null;
        if (!sessionUser) {
          if (isProcessing) {
            setSafeState({ user: null, perfil: null, loading: false, error: null });
          }
          return;
        }
        if (isProcessing) {
          await fetchPerfilForSessionUser(sessionUser);
        }
      } catch (error) {
        if (isProcessing) {
          handleProfileError(error);
        }
      }
    };

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMountedRef.current) return;
      const sessionUser = session?.user ?? null;
      if (!sessionUser) {
        setSafeState({ user: null, perfil: null, loading: false, error: null });
        return;
      }
      fetchPerfilForSessionUser(sessionUser);
    });

    return () => {
      isProcessing = false;
      listener?.subscription?.unsubscribe();
    };
  }, [fetchPerfilForSessionUser, handleProfileError, isMountedRef, setSafeState]);

  const login = useCallback(async (email, password) => {
    setSafeState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rawProfile = await loginConEmailYPassword(email, password);
      return handleProfileSuccess(rawProfile);
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Error al iniciar sesión, inténtalo nuevamente");
      setSafeState((prev) => ({ ...prev, loading: false, error: normalizedError }));
      throw normalizedError;
    }
  }, [handleProfileSuccess, setSafeState]);

  const logout = useCallback(async () => {
    setSafeState((prev) => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSafeState({ user: null, perfil: null, loading: false, error: null });
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("No se pudo cerrar la sesión actualmente");
      setSafeState((prev) => ({ ...prev, loading: false, error: normalizedError }));
      throw normalizedError;
    }
  }, [setSafeState]);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      refreshPerfil
    }),
    [login, logout, refreshPerfil, state]
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
