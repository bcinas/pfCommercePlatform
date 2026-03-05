'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True only during the initial sessionStorage hydration on mount */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Call after a successful profile update to keep sessionStorage + state in sync */
  updateUser: (updated: ApiAuthResponse) => void;
}

interface ApiAuthResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'pf_auth_user';
const BASE_URL = 'http://localhost:5000/api/auth';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from sessionStorage after mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  function persistUser(data: ApiAuthResponse) {
    const authUser: AuthUser = {
      id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      token: data.token,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message ?? 'Login failed. Please check your credentials.');
    }

    const data = (await res.json()) as ApiAuthResponse;
    persistUser(data);
  }

  async function register(name: string, email: string, password: string) {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message ?? 'Registration failed. Please try again.');
    }

    const data = (await res.json()) as ApiAuthResponse;
    persistUser(data);
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  function updateUser(data: ApiAuthResponse) {
    persistUser(data);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
