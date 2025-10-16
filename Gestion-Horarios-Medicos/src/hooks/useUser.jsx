// --- ARCHIVO: src/hooks/useUser.jsx ---
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { loginConEmailYPassword, obtenerPerfilUsuarioPorEmail } from "@/services/auth";

const DEFAULT_ROLE = "secretaria";

function normalizarDato(obj) {
  if (!obj) return null;
  if (Array.isArray(obj)) {
    return obj[0] ?? null;
  }
  return obj;
}

function mapUserProfile(profile) {
  if (!profile) return null;

  // CODEx: Se homogeniza la forma del perfil para exponer idPersona, rol y vínculos opcionales.
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
  };
}

async function fetchUserProfileByEmail(email) {
  const rawProfile = await obtenerPerfilUsuarioPorEmail(email);
  return mapUserProfile(rawProfile);
}

async function safeSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("// CODEx: Error al forzar signOut", error);
  }
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
    async function syncSession(session) {
      if (!isMountedRef.current) return;

      if (!session?.user?.email) {
        setUser(null);
        return;
      }

      try {
        const mappedProfile = await fetchUserProfileByEmail(session.user.email);
        if (!isMountedRef.current) return;
        setUser(mappedProfile);
      } catch (error) {
        console.error("// CODEx: No se pudo sincronizar el perfil activo", error);
        if (isMountedRef.current) {
          setUser(null);
        }
        await safeSignOut();
      }
    }

    async function bootstrap() {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        await syncSession(data?.session ?? null);
      } catch (error) {
        console.error("// CODEx: Error al restaurar la sesión activa", error);
        if (isMountedRef.current) {
          setUser(null);
        }
        await safeSignOut();
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMountedRef.current) return;
      setLoading(true);
      try {
        await syncSession(session ?? null);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMountedRef.current = false;
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
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await safeSignOut();
      setUser(null);
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

  return (
    <UserContext.Provider value={value}>
      {loading ? (
        <div className="flex w-full justify-center py-8 text-sm text-slate-500">
          {/* // CODEx: Se muestra un placeholder de carga mientras se restaura la sesión. */}
          Cargando sesión...
        </div>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser debe utilizarse dentro de un UserProvider");
  }
  return context;
}
