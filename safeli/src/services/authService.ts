import apiClient from '../app/apiClient';
import { USE_MOCK_AUTH } from '../constants/config';
import {
  LoginRequest,
  SignUpRequest,
  AuthResponse,
  ForgotPasswordRequest,
  VerifyCodeRequest,
  ResetPasswordRequest,
  User,
  BackendLoginBody,
  BackendRegisterBody,
  BackendAuthResponse,
  BackendMeResponse,
} from '../types/auth.types';

// ─── Helpers de mapeo ─────────────────────────────────────────────────────────

/** BackendUser → User (frontend) */
function mapBackendUser(bu: BackendAuthResponse['user']): User {
  return {
    id: bu.id, // ← Ahora ambos son number, no rompe
    username: bu.username,
    email: bu.email,
    firstName: bu.nombre,
    lastName: bu.apellido,
    ...((bu.nroTelefono !== undefined && bu.nroTelefono !== null) ? { nroTelefono: bu.nroTelefono } : {}),
    ...(bu.foto ? { foto: bu.foto } : {}),
  } as User;
  };

/** AuthResponse frontend construido desde la respuesta del backend */
function mapBackendAuthResponse(raw: BackendAuthResponse): AuthResponse {
  return {
    accessToken: raw.accessToken,
    refreshToken: raw.refreshToken,
    user: mapBackendUser(raw.user),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const authService = {

  // POST /auth/login
  async login(data: LoginRequest): Promise<AuthResponse> {
    if (USE_MOCK_AUTH) {
      return mockLogin(data);
    }

    const body: BackendLoginBody = {
      username: data.username,
      contraseña: data.password,
    };

    const response = await apiClient.post<BackendAuthResponse>('/auth/login', body);
    return mapBackendAuthResponse(response.data);
  },

  // POST /auth/register
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    if (USE_MOCK_AUTH) {
      return mockSignUp(data);
    }

    const body: BackendRegisterBody = {
      nombre: data.firstName,
      apellido: data.lastName,
      email: data.email,
      username: data.username,
      fechaNacimiento: data.birthDate,
      contraseña: data.password,
      nroTelefono: data.nroTelefono || null, // Si está vacío, manda null
      foto: data.foto || '-1',               // Valor default según tu script SQL
    };

    const response = await apiClient.post<BackendAuthResponse>('/auth/register', body);
    return mapBackendAuthResponse(response.data);
  },

  // POST /auth/logout
  async logout(refreshToken: string): Promise<void> {
    if (USE_MOCK_AUTH) return;
    await apiClient.post('/auth/logout', { refreshToken });
  },

  // GET /auth/me
  async getMe(): Promise<User> {
    if (USE_MOCK_AUTH) {
      const { tokenStorage } = await import('./tokenStorage');
      const userJson = await tokenStorage.getUser();
      if (userJson) return JSON.parse(userJson) as User;
      throw new Error('No mock user saved');
    }

    const response = await apiClient.get<BackendMeResponse>('/auth/me');
    return mapBackendUser(response.data);
  },

  // POST /auth/forgot-password
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    if (USE_MOCK_AUTH) return;
    await apiClient.post('/auth/forgot-password', data);
  },

  // POST /auth/verify-code
  async verifyCode(data: VerifyCodeRequest): Promise<void> {
    if (USE_MOCK_AUTH) return;
    await apiClient.post('/auth/verify-code', data);
  },

  // POST /auth/reset-password
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    if (USE_MOCK_AUTH) return;
    await apiClient.post('/auth/reset-password', {
      email: data.email,
      code: data.code,
      nuevaContraseña: data.newPassword,
    });
  },
};

// ─── Mock helpers (fijados los errores de conversión) ─────────────────────────

async function mockLogin(data: LoginRequest): Promise<AuthResponse> {
  const { tokenStorage } = await import('./tokenStorage');
  const users = await tokenStorage.getMockUsers();
  const found = users.find(
    (u: any) => u.username === data.username || u.email === data.username,
  );
  if (!found) throw new Error('Usuario no registrado');
  if (found.password !== data.password) throw new Error('Credenciales inválidas');

  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: found.id ?? 0,
      username: found.username,
      email: found.email,
      firstName: found.firstName,
      lastName: found.lastName ?? '',
      ...(found.nroTelefono ? { nroTelefono: found.nroTelefono } : {}),
      ...(found.foto ? { foto: found.foto } : {}),
    } as User,
  };
}

async function mockSignUp(data: SignUpRequest): Promise<AuthResponse> {
  const { tokenStorage } = await import('./tokenStorage');
  const mockStored = {
    id: Date.now(), // Un número para simular el serial id
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    password: data.password,
    nroTelefono: data.nroTelefono || null,
    foto: data.foto || '-1',
  };
  await tokenStorage.saveMockUser(JSON.stringify(mockStored));
  const { password, ...userNoPass } = mockStored;

  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: userNoPass as User, // ← Ahora machataca perfectamente sin dar error
  };
}