import { AxiosError } from 'axios';
import apiClient from '../app/apiClient';
import {
    AuthResponse,
    BackendAuthResponse,
    BackendLoginBody,
    BackendMeResponse,
    BackendRegisterBody,
    BackendUser,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    SignUpRequest,
    UpdateProfileRequest,
    User,
    VerifyCodeRequest,
} from '../types/auth_types';

function parseBackendError(error: unknown): Error {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    const backendMessage: string | undefined =
      typeof data === 'string'
        ? data
        : data?.message ?? data?.error ?? data?.details ?? undefined;

    const pgCode: string | undefined = data?.code;

    if (pgCode) {
      switch (pgCode) {
        case '23505': // unique_violation — username o email duplicado
          return new Error('El usuario o email ya está registrado.');
        case '23502': // not_null_violation — campo requerido faltante
          return new Error('Faltan datos requeridos. Completá todos los campos.');
        case '23503': // foreign_key_violation
          return new Error('Error de integridad de datos. Contactá soporte.');
        case 'PGRST116': // no rows found (Supabase REST)
          return new Error('Usuario no encontrado.');
        case 'PGRST301': // JWT expired (Supabase)
          return new Error('Tu sesión expiró. Iniciá sesión de nuevo.');
      }
    }

    switch (status) {
      case 400:
        return new Error(backendMessage ?? 'Datos inválidos. Revisá el formulario.');
      case 401:
        return new Error(backendMessage ?? 'Usuario o contraseña incorrectos.');
      case 403:
        return new Error(backendMessage ?? 'No tenés permiso para realizar esta acción.');
      case 404:
        return new Error(backendMessage ?? 'Usuario no encontrado.');
      case 409:
        return new Error(backendMessage ?? 'El usuario o email ya está registrado.');
      case 422:
        return new Error(backendMessage ?? 'Los datos enviados no son válidos.');
      case 429:
        return new Error('Demasiados intentos. Esperá unos minutos y volvé a intentar.');
      case 500:
      case 502:
      case 503:
        return new Error('El servidor no está disponible. Intentá más tarde.');
      default:
        if (!error.response) {
          return new Error('Sin conexión. Verificá tu red e intentá de nuevo.');
        }
        return new Error(backendMessage ?? 'Ocurrió un error inesperado.');
    }
  }

  if (error instanceof Error) return error;
  return new Error('Ocurrió un error inesperado.');
}

// ─── Helpers de mapeo ─────────────────────────────────────────────────────────

function mapBackendUser(bu: BackendUser): User {
  return {
    id: bu.id,
    username: bu.username,
    email: bu.email,
    firstName: bu.nombre,
    lastName: bu.apellido,
    ...(bu.nroTelefono !== undefined && bu.nroTelefono !== null ? { nroTelefono: bu.nroTelefono } : {}),
    ...(bu.foto ? { foto: bu.foto } : {}),
    ...(bu.fechaNacimiento ? { birthDate: bu.fechaNacimiento } : {}),
  } as User;
}

function mapBackendAuthResponse(raw: BackendAuthResponse): AuthResponse {
  return {
    accessToken: raw.accessToken,
    refreshToken: raw.refreshToken,
    user: mapBackendUser(raw.user),
  };
}

async function normalizeUserResponse(response: any): Promise<User> {
  const payload = response?.data?.user ?? response?.data;
  if (payload && typeof payload === 'object' && ('id' in payload || 'username' in payload)) {
    return mapBackendUser(payload as BackendUser);
  }
  throw new Error('No se pudo interpretar la respuesta del servidor.');
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const body: BackendLoginBody = {
        username: data.username,
        contraseña: data.password,
      };
      const response = await apiClient.post<BackendAuthResponse>('/auth/login', body);
      return mapBackendAuthResponse(response.data);
    } catch (error) {
      throw parseBackendError(error);
    }
  },

  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    try {
      let response;

      const fotoObj = data.foto as any;
      const isFile = data.foto && typeof data.foto === 'object' && (
        (typeof File !== 'undefined' && fotoObj instanceof File) ||
        'uri' in fotoObj ||
        'name' in fotoObj
      );

      if (isFile) {
        const formData = new FormData();
        formData.append('nombre', data.firstName);
        formData.append('apellido', data.lastName);
        formData.append('email', data.email);
        formData.append('username', data.username);
        formData.append('fechaNacimiento', data.birthDate);
        formData.append('password', data.password);
        if (data.nroTelefono !== undefined && data.nroTelefono !== null) {
          formData.append('nroTelefono', String(data.nroTelefono));
        }

        if (fotoObj instanceof File || ('name' in fotoObj && !('uri' in fotoObj))) {
          formData.append('foto', data.foto as any);
        } else if (fotoObj?.uri) {
          const res = await fetch(fotoObj.uri);
          const blob = await res.blob();
          formData.append('foto', blob, 'photo.jpg');
        }

        response = await apiClient.post<BackendAuthResponse>('/auth/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        const body: BackendRegisterBody = {
          nombre: data.firstName,
          apellido: data.lastName,
          email: data.email,
          username: data.username,
          fechaNacimiento: data.birthDate,
          contraseña: data.password,
          nroTelefono: data.nroTelefono || null,
          foto: typeof data.foto === 'string' ? data.foto : '-1',
        };
        response = await apiClient.post<BackendAuthResponse>('/auth/register', body);
      }
      return mapBackendAuthResponse(response.data);
    } catch (error) {
      throw parseBackendError(error);
    }
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (error) {
      throw parseBackendError(error);
    }
  },

  async getMe(): Promise<User> {
    try {
      const response = await apiClient.get<BackendMeResponse>('/auth/me');
      return mapBackendUser(response.data);
    } catch (error) {
      throw parseBackendError(error);
    }
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      const payload: Record<string, any> = {};

      if (data.firstName !== undefined) payload.nombre = data.firstName;
      if (data.lastName !== undefined) payload.apellido = data.lastName;
      if (data.email !== undefined) payload.email = data.email;
      if (data.username !== undefined) payload.username = data.username;
      if (data.birthDate !== undefined) payload.fechaNacimiento = data.birthDate;
      if (data.nroTelefono !== undefined) payload.nroTelefono = data.nroTelefono;
      if (data.foto !== undefined) payload.foto = typeof data.foto === 'string' ? data.foto : '-1';

      const response = await apiClient.patch('/auth/perfil', payload);
      return await normalizeUserResponse(response);
    } catch (error) {
      throw parseBackendError(error);
    }
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      const payload = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      };

      await apiClient.post('/auth/change-password', payload);
    } catch (error) {
      throw parseBackendError(error);
    }
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', data);
    } catch (error) {
      throw parseBackendError(error);
    }
  },

  async verifyCode(data: VerifyCodeRequest): Promise<void> {
    try {
      await apiClient.post('/auth/verify-code', data);
    } catch (error) {
      throw parseBackendError(error);
    }
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        email: data.email,
        code: data.code,
        nuevaContraseña: data.newPassword,
      });
    } catch (error) {
      throw parseBackendError(error);
    }
  },
};