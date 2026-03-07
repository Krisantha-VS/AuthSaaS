export type ApiResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export interface JwtPayload {
  sub: string;       // userId
  appId: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
