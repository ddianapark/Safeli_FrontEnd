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
  nroTelefono?: number | null;
  foto?: string;
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
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  nroTelefono?: number | null;
  foto?: string;
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
  map: (data: MapRequest) => Promise<void>;
  // Revalida la sesión y actualiza los datos del usuario desde el backend.
  // Útil para reflejar cambios de perfil o luego de un largo período inactivo.
  refreshUser: () => Promise<void>;
}

export interface BackendLoginBody {
  username: string;
  contraseña: string;
}

export interface BackendRegisterBody {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  fechaNacimiento: string; // YYYY-MM-DD
  contraseña: string;
  nroTelefono?: number | null;
  foto?: string;
}

export interface BackendUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  nroTelefono?: number | null;
  foto?: string;
  fechaNacimiento?: string;
  contactoEmergencia?: number | null;
  ubicacion?: string | null;
}

export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
}

export type BackendMeResponse = BackendUser;