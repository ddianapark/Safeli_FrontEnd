import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type {
  AuthContextType,
  ChangePasswordRequest,
  LoginRequest,
  SignUpRequest,
  User,
} from '../types/auth_types';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'https://safeli-api.vercel.app';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    const responseText = await response.text();

    try {
      const parsed = responseText ? JSON.parse(responseText) : null;
      if (parsed && typeof parsed === 'object') {
        const message = parsed.message || parsed.error || parsed.details || 'Error del servidor';
        throw new Error(String(message));
      }
    } catch {
      // No es JSON o no se pudo parsear. Pasamos a validar si fue HTML.
    }

    if (responseText.trim().startsWith('<')) {
      throw new Error('El servidor devolvió una página HTML en lugar de JSON. Revisá la URL o el backend.');
    }

    if (responseText.trim()) {
      throw new Error(responseText.trim().slice(0, 200));
    }

    throw new Error(`Error del servidor (${response.status}).`);
  }

  if (!contentType.includes('application/json') && !contentType.includes('+json')) {
    const responseText = await response.text();
    if (responseText.trim().startsWith('<')) {
      throw new Error('El servidor devolvió una respuesta HTML en lugar de JSON. Revisá la URL o el backend.');
    }
    throw new Error(`Respuesta inválida del servidor (tipo: ${contentType || 'desconocido'}).`);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    const responseText = await response.clone().text();
    const preview = responseText.trim().slice(0, 200);
    throw new Error(
      preview
        ? `La respuesta del servidor no es JSON válido: ${preview}`
        : 'La respuesta del servidor no es JSON válido.'
    );
  }
}

interface AuthContextData extends AuthContextType {
  signIn: (data: LoginRequest) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  token: string | null;
}

export const tokenStorage = {
  getAccessToken: async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('safeli_access_token');
    }
    return SecureStore.getItemAsync('safeli_access_token');
  },

  getRefreshToken: async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('safeli_refresh_token');
    }
    return SecureStore.getItemAsync('safeli_refresh_token');
  },

  saveTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem('safeli_access_token', accessToken);
      localStorage.setItem('safeli_refresh_token', refreshToken);
      return;
    }

    await SecureStore.setItemAsync('safeli_access_token', accessToken);
    await SecureStore.setItemAsync('safeli_refresh_token', refreshToken);
  },

  saveUser: async (user: User): Promise<void> => {
    const payload = JSON.stringify(user);

    if (Platform.OS === 'web') {
      localStorage.setItem('safeli_user', payload);
      return;
    }

    await SecureStore.setItemAsync('safeli_user', payload);
  },

  getUser: async (): Promise<User | null> => {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem('safeli_user')
        : await SecureStore.getItemAsync('safeli_user');

    if (!raw) return null;

    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  clear: async (): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('safeli_access_token');
      localStorage.removeItem('safeli_refresh_token');
      localStorage.removeItem('safeli_user');
      return;
    }

    await SecureStore.deleteItemAsync('safeli_access_token');
    await SecureStore.deleteItemAsync('safeli_refresh_token');
    await SecureStore.deleteItemAsync('safeli_user');
  },
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedUser = await tokenStorage.getUser();
        const accessToken = await tokenStorage.getAccessToken();

        if (savedUser && accessToken) {
          setUser(savedUser);
          setToken(accessToken);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error restoring auth session', error);
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const signIn = async (data: LoginRequest): Promise<void> => {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: data.username,
        password: data.password,
      }),
    });

    const result = await parseJsonResponse<{
      accessToken?: string;
      refreshToken?: string;
      user?: User;
      message?: string;
    }>(response);

    if (!result.accessToken || !result.refreshToken || !result.user) {
      throw new Error('Respuesta inválida del servidor');
    }

    const accessToken = result.accessToken;
    const refreshToken = result.refreshToken;
    const userData = result.user as User;

    await tokenStorage.saveTokens(accessToken, refreshToken);
    await tokenStorage.saveUser(userData);
    setUser(userData);
    setToken(accessToken);
    setIsAuthenticated(true);
  };

  const signUp = async (data: SignUpRequest): Promise<void> => {
    const formData = new FormData();

    formData.append('nombre', data.firstName);
    formData.append('apellido', data.lastName);
    formData.append('email', data.email);
    formData.append('username', data.username);
    formData.append('fechaNacimiento', data.birthDate);
    formData.append('contraseña', data.password);

    if (data.nroTelefono !== undefined && data.nroTelefono !== null) {
      formData.append('nroTelefono', String(data.nroTelefono));
    }

    if (data.contactoEmergencia !== undefined) {
      formData.append('contactoEmergencia', String(data.contactoEmergencia ?? -1));
    }

    if (data.foto) {
      formData.append('foto', data.foto as any);
    }

    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      body: formData,
    });

    const result = await parseJsonResponse<{
      accessToken?: string;
      refreshToken?: string;
      user?: User;
      message?: string;
    }>(response);

    const accessToken = result.accessToken;
    const refreshToken = result.refreshToken;
    const userData = result.user as User;

    if (accessToken && refreshToken && userData) {
      await tokenStorage.saveTokens(accessToken, refreshToken);
      await tokenStorage.saveUser(userData);
      setUser(userData);
      setToken(accessToken);
      setIsAuthenticated(true);
    }
  };

  const signOut = async (): Promise<void> => {
    await tokenStorage.clear();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    const response = await fetch(`${BACKEND_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      }),
    });

    await parseJsonResponse<{ message?: string }>(response);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
        map: async () => undefined,
        refreshUser: async () => undefined,
        updateProfile: async (data) => {
          if (!user) throw new Error('No hay sesión activa');
          return user;
        },
        changePassword,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};