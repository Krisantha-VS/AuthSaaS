export interface AuthConfig {
  clientId: string;
  baseUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  emailVerified: boolean;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
  expiresAt: number; // timestamp ms
}

export type AuthEvent =
  | 'signedIn'
  | 'signedOut'
  | 'tokenRefreshed'
  | 'sessionExpired';

export type AuthEventListener = (session: AuthSession | null) => void;

export interface RegisterParams {
  email: string;
  password: string;
  name?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}
