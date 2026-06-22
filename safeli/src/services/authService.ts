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
} from '../types/auth.types';

export const authService = {
  // POST /auth/login
  async login(data: LoginRequest): Promise<AuthResponse> {
    if (USE_MOCK_AUTH) {
      // Validate against mock users stored locally
      const tokenStorage = await import('./tokenStorage').then((m) => m.tokenStorage);
      const users = await tokenStorage.getMockUsers();
      const found = users.find((u: any) => u.username === data.username || u.email === data.username);
      if (!found) {
        throw new Error('Usuario no registrado');
      }
      if (found.password !== (data as any).password) {
        throw new Error('Credenciales inválidas');
      }
      const mockUser = {
        id: found.id || `mock-user-${Date.now()}`,
        username: found.username,
        email: found.email,
        firstName: found.firstName,
        lastName: found.lastName || '',
      };
      return {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
      };
    }

    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // POST /auth/register
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    if (USE_MOCK_AUTH) {
      // Save mock user with password for later validation
      const tokenStorage = await import('./tokenStorage').then((m) => m.tokenStorage);
      const mockStored = {
        id: `mock-user-${Date.now()}`,
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: (data as any).password,
      };
      await tokenStorage.saveMockUser(JSON.stringify(mockStored));
      const { password, ...userNoPass } = mockStored;
      return {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: userNoPass as any,
      };
    }

    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // POST /auth/logout
  async logout(refreshToken: string): Promise<void> {
    if (USE_MOCK_AUTH) {
      return;
    }
    await apiClient.post('/auth/logout', { refreshToken });
  },

  // GET /auth/me — rehydrata el usuario con el access token guardado
  async getMe(): Promise<User> {
    if (USE_MOCK_AUTH) {
      const userJson = await import('./tokenStorage').then((m) => m.tokenStorage.getUser());
      if (userJson) return JSON.parse(userJson) as User;
      throw new Error('No mock user saved');
    }

    const response = await apiClient.get<User>('/auth/me');
    return response.data;
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
    await apiClient.post('/auth/reset-password', data);
  },
};