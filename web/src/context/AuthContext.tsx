import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, cacheUser, clearToken, getCachedUser, getToken, isLoggedIn, setToken } from "../lib/api";
import type { Subscription, SubscriptionStatusResponse, User } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loggedIn: boolean;
  subscription: Subscription | null;
  subscriptionStatus: SubscriptionStatusResponse | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, string>) => Promise<User>;
  setUser: (user: User) => void;
  logout: () => void;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getCachedUser());
  const [loading, setLoading] = useState<boolean>(!!getToken());
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusResponse | null>(null);

  const refreshSubscription = useCallback(async () => {
    if (!isLoggedIn()) {
      setSubscription(null);
      setSubscriptionStatus(null);
      return;
    }

    try {
      const data = await api.subscriptionStatus();
      const status = data.data;
      setSubscriptionStatus(status);
      if (status.plan !== "FREE" && status.isActive) {
        setSubscription({ id: 0, plan: status.plan as any, status: status.status as any, provider: "", amount: 0, currency: "KES", createdAt: "" });
      } else {
        setSubscription(null);
      }
    } catch {
      setSubscription(null);
      setSubscriptionStatus(null);
    }
  }, []);

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

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

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
    setSubscription(null);
    setSubscriptionStatus(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, loggedIn: !!user, subscription, subscriptionStatus, login, register, setUser, logout, refreshSubscription }}
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
