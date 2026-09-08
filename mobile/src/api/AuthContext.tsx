// mobile/src/api/AuthContext.tsx
//
// Shared auth state for the app. Login/logout both go through the real
// BWE API (/api/auth/login, /api/auth/me) -- no mock session, no locally
// fabricated user object.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest } from "./client";
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "../storage/session";

export type BweUser = {
  id: string;
  email: string;
  accountType: string;
  isAdmin?: boolean;
};

type AuthContextValue = {
  user: BweUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BweUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const result = await apiRequest<{ user: BweUser | null }>("/api/auth/me");
    setUser(result.ok ? result.data.user : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiRequest<{
        success: boolean;
        token?: string;
        user?: BweUser;
        error?: string;
      }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      if (!result.ok || !result.data.success || !result.data.token) {
        return {
          ok: false,
          error: result.ok ? result.data.error : result.error,
        };
      }
      await setStoredToken(result.data.token);
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await clearStoredToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
