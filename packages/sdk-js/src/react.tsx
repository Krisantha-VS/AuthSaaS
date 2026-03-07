'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthSession, AuthUser, LoginParams, RegisterParams } from './types';
import { AuthClient } from './client';

interface AuthContextValue {
  client: AuthClient;
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  client: AuthClient;
  children: React.ReactNode;
}

export function AuthProvider({ client, children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() => client.getSession());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const offSignedIn  = client.on('signedIn',      s => setSession(s));
    const offSignedOut = client.on('signedOut',      () => setSession(null));
    const offRefreshed = client.on('tokenRefreshed', s => setSession(s));
    const offExpired   = client.on('sessionExpired', () => setSession(null));
    return () => { offSignedIn(); offSignedOut(); offRefreshed(); offExpired(); };
  }, [client]);

  const login = useCallback(async (params: LoginParams) => {
    setIsLoading(true);
    try { await client.login(params); }
    finally { setIsLoading(false); }
  }, [client]);

  const register = useCallback(async (params: RegisterParams) => {
    setIsLoading(true);
    try { await client.register(params); }
    finally { setIsLoading(false); }
  }, [client]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try { await client.logout(); }
    finally { setIsLoading(false); }
  }, [client]);

  return (
    <AuthContext.Provider value={{
      client,
      session,
      user: session?.user ?? null,
      isAuthenticated: client.isAuthenticated(),
      isLoading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function useAuthFetch() {
  const { client } = useAuth();
  return useCallback(
    (input: RequestInfo, init?: RequestInit) => client.authFetch(input, init),
    [client]
  );
}
