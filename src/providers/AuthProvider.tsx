"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, TOKEN_KEY, USER_KEY } from "@/lib/api";
import type { AuthUser, Role } from "@/lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  demoLogin: (role: DemoRole) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
};

export type DemoRole = "BUYER" | "VENDOR" | "ADMIN";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  address?: string;
  date_of_birth?: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const persist = (user: AuthUser) => {
  window.localStorage.setItem(TOKEN_KEY, user.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  // `ready` keeps guarded pages from redirecting before localStorage is read
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(USER_KEY);
      const token = window.localStorage.getItem(TOKEN_KEY);

      if (stored && token) {
        setUserState(JSON.parse(stored) as AuthUser);
      }
    } catch {
      window.localStorage.removeItem(USER_KEY);
      window.localStorage.removeItem(TOKEN_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthUser>("/auth/login", { email, password });
    persist(res.data);
    setUserState(res.data);
    return res.data;
  }, []);

  // Signs in to a seeded, read-only account. No credentials: the server only
  // ever hands out accounts it has flagged as demo, and refuses their writes.
  const demoLogin = useCallback(async (role: DemoRole) => {
    const res = await api.post<AuthUser>("/demo/login", { role });
    persist(res.data);
    setUserState(res.data);
    return res.data;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await api.post<AuthUser>("/auth/register", {
      ...payload,
      role: "USER",
    });
    persist(res.data);
    setUserState(res.data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUserState(null);
  }, []);

  const setUser = useCallback((next: AuthUser) => {
    persist(next);
    setUserState(next);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role: Role | undefined = user?.role;

    return {
      user,
      ready,
      isVendor: role === "VENDOR",
      isAdmin: role === "ADMIN" || role === "SUPERADMIN",
      isDemo: user?.is_demo === true,
      login,
      demoLogin,
      register,
      logout,
      setUser,
    };
  }, [user, ready, login, demoLogin, register, logout, setUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
};
