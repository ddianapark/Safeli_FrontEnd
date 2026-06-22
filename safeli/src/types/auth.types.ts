export interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthDate: string; // ISO format: YYYY-MM-DD
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface MapRequest {
  latitude: number;
  longitude: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
  map:(data: MapRequest) => Promise<void>;

  };