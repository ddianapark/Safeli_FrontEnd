import apiClient from './apiClient';
import {
  LoginRequest,
  SignUpRequest,
  AuthResponse,
  ForgotPasswordRequest,
  VerifyCodeRequest,
  ResetPasswordRequest,
} from '../types/auth.types';

export const authService = {
  // TODO: Confirm endpoint with backend — POST /auth/login
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // TODO: Confirm endpoint with backend — POST /auth/register
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // TODO: Confirm endpoint with backend — POST /auth/logout
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  // TODO: Confirm endpoint with backend — POST /auth/forgot-password
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', data);
  },

  // TODO: Confirm endpoint with backend — POST /auth/verify-code
  async verifyCode(data: VerifyCodeRequest): Promise<void> {
    await apiClient.post('/auth/verify-code', data);
  },

  // TODO: Confirm endpoint with backend — POST /auth/reset-password
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  },
};