export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  requires2FA: boolean;
  userId?: number;
}

export interface Confirm2FARequest {
  userId: number;
  code: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: number | null;
  username: string | null;
  role: number | null;
}
