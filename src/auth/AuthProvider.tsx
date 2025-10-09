// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { AuthService, type MeResponse } from "./AuthService";

const Ctx = createContext<AuthService | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const service = useMemo(() => new AuthService(), []);
  return <Ctx.Provider value={service}>{children}</Ctx.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthService() {
  const svc = useContext(Ctx);
  if (!svc) throw new Error("useAuthService must be inside <AuthProvider>");
  return svc;
}

// optional: subscribe to current user changes (simple poll via me() on demand)
// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser(): MeResponse | null {
  const svc = useAuthService();
  // minimal subscribe shim; replace with state lib if preferred
  return useSyncExternalStore(
    (cb) => { const id = setInterval(cb, 1000); return () => clearInterval(id); },
    () => svc.current
  );
}
