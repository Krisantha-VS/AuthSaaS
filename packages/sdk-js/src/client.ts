import type {
  AuthConfig, AuthSession, AuthTokens, AuthUser,
  AuthEvent, AuthEventListener, RegisterParams, LoginParams,
} from './types';

const DEFAULT_BASE = '/api/v1';
const SESSION_KEY = 'auth_session';

export class AuthClient {
  private config: Required<AuthConfig>;
  private session: AuthSession | null = null;
  private listeners: Map<AuthEvent, Set<AuthEventListener>> = new Map();
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(config: AuthConfig) {
    this.config = { baseUrl: DEFAULT_BASE, ...config };
    this.loadSession();
  }

  // ─── Session ─────────────────────────────────────────

  private loadSession() {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) this.session = JSON.parse(raw);
    } catch { this.session = null; }
  }

  private saveSession(session: AuthSession | null) {
    this.session = session;
    if (typeof window === 'undefined') return;
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  getUser(): AuthUser | null {
    return this.session?.user ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.session && this.session.expiresAt > Date.now();
  }

  // ─── Auth Actions ─────────────────────────────────────

  async register(params: RegisterParams): Promise<AuthSession> {
    const data = await this.post<{ user: AuthUser; tokens: AuthTokens }>('/auth/register', {
      clientId: this.config.clientId,
      ...params,
    });
    const session = this.buildSession(data.user, data.tokens);
    this.saveSession(session);
    this.emit('signedIn', session);
    return session;
  }

  async login(params: LoginParams): Promise<AuthSession> {
    const tokens = await this.post<AuthTokens>('/auth/login', {
      clientId: this.config.clientId,
      ...params,
    });
    const user = this.parseTokenUser(tokens.accessToken);
    const session = this.buildSession(user, tokens);
    this.saveSession(session);
    this.emit('signedIn', session);
    return session;
  }

  async logout(): Promise<void> {
    if (this.session) {
      await this.post('/auth/logout', {}, { auth: true }).catch(() => {});
    }
    this.saveSession(null);
    this.emit('signedOut', null);
  }

  async refreshTokens(): Promise<AuthTokens> {
    // Deduplicate concurrent refresh calls
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.post<AuthTokens>('/auth/refresh', {
      refreshToken: this.session?.tokens.refreshToken,
    }).then(tokens => {
      if (this.session) {
        const session = this.buildSession(this.session.user, tokens);
        this.saveSession(session);
        this.emit('tokenRefreshed', session);
      }
      this.refreshPromise = null;
      return tokens;
    }).catch(err => {
      this.refreshPromise = null;
      this.saveSession(null);
      this.emit('sessionExpired', null);
      throw err;
    });

    return this.refreshPromise;
  }

  // ─── authFetch ────────────────────────────────────────

  async authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
    if (!this.isAuthenticated() && this.session) {
      await this.refreshTokens();
    }

    const token = this.session?.tokens.accessToken;
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(input, { ...init, headers });

    if (res.status === 401 && this.session) {
      // Token expired mid-request — refresh and retry once
      await this.refreshTokens();
      headers.set('Authorization', `Bearer ${this.session!.tokens.accessToken}`);
      return fetch(input, { ...init, headers });
    }

    return res;
  }

  // ─── Events ───────────────────────────────────────────

  on(event: AuthEvent, listener: AuthEventListener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  private emit(event: AuthEvent, session: AuthSession | null) {
    this.listeners.get(event)?.forEach(fn => fn(session));
  }

  // ─── Helpers ──────────────────────────────────────────

  private buildSession(user: AuthUser, tokens: AuthTokens): AuthSession {
    return {
      user,
      tokens,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    };
  }

  private parseTokenUser(accessToken: string): AuthUser {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name ?? null,
      roles: payload.roles ?? [],
      emailVerified: payload.emailVerified ?? false,
    };
  }

  private async post<T>(path: string, body: unknown, options: { auth?: boolean } = {}): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.auth && this.session?.tokens.accessToken) {
      headers['Authorization'] = `Bearer ${this.session.tokens.accessToken}`;
    }
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.code ?? 'UNKNOWN_ERROR');
    return json.data as T;
  }
}
