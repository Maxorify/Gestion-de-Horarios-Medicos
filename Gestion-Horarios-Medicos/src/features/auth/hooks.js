// src/features/auth/hooks.js
import { useUser as useUserContext } from "@/hooks/useUser";

export function useUser() {
  // CODEx: Se reutiliza el UserProvider global para evitar lecturas directas a tablas antiguas.
  return useUserContext();
}
