'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { TenantInfo, TenantTokens } from '@/lib/dashboard-api';

interface Session {
  tenant: TenantInfo;
  tokens: TenantTokens;
}

interface AuthCtx {
  session:  Session | null;
  loading:  boolean;
  login:    (session: Session) => void;
  logout:   () => void;
  token:    string | null;
}

const Ctx = createContext<AuthCtx | null>(null);

const STORAGE_KEY = 'as_dashboard';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? Date.now() >= payload.exp * 1000 : false;
  } catch {
    return true; // malformed token — treat as expired
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Session = JSON.parse(raw);
        if (parsed.tokens?.accessToken && !isTokenExpired(parsed.tokens.accessToken)) {
          setSession(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY); // expired — force re-login
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const login = useCallback((s: Session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    router.push('/dashboard/login');
  }, [router]);

  return (
    <Ctx.Provider value={{
      session,
      loading,
      login,
      logout,
      token: session?.tokens.accessToken ?? null,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDashboardAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDashboardAuth must be used inside DashboardProvider');
  return ctx;
}
