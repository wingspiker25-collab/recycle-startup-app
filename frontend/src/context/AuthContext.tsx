import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "user" | "admin" | "driver";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "recycle_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { token: t, user: u } = JSON.parse(raw);
        if (t && u) {
          setToken(t);
          setUserState(u);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((t: string, u: User) => {
    setToken(t);
    setUserState(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setUser = useCallback((u: User) => {
    setUserState(u);
    const t = token || JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").token;
    if (t) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
