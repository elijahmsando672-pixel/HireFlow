import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, cacheUser, clearToken, getCachedUser, getToken, isLoggedIn, setToken } from "../lib/api";
import type { User } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loggedIn: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, string>) => Promise<User>;
  setUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getCachedUser());
  const [loading, setLoading] = useState<boolean>(!!getToken());

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    api
      .me()
      .then((data) => {
        if (cancelled) return;
        cacheUser(data.user);
        setUser(data.user);
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        localStorage.removeItem("hireflow_user");
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    setToken(data.token);
    cacheUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (data: Record<string, string>) => {
    const result = await api.register(data);
    setToken(result.token);
    cacheUser(result.user);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem("hireflow_user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, loggedIn: !!user, login, register, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
