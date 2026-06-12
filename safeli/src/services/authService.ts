import apiClient from '../app/apiClient';
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
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // POST /auth/register
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // POST /auth/logout
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  // GET /auth/me — rehydrata el usuario con el access token guardado
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // POST /auth/forgot-password
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', data);
  },

  // POST /auth/verify-code
  async verifyCode(data: VerifyCodeRequest): Promise<void> {
    await apiClient.post('/auth/verify-code', data);
  },

  // POST /auth/reset-password
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  },
};