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

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || 'Error al iniciar sesión');
    }

    const accessToken = result.accessToken;
    const refreshToken = result.refreshToken;
    const userData = result.user as User;

    if (!accessToken || !refreshToken || !userData) {
      throw new Error('Respuesta inválida del servidor');
    }

    await tokenStorage.saveTokens(accessToken, refreshToken);
    await tokenStorage.saveUser(userData);
    setUser(userData);
    setToken(accessToken);
    setIsAuthenticated(true);
  };

  const signUp = async (data: SignUpRequest): Promise<void> => {
    const formData = new FormData();

    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    formData.append('email', data.email);
    formData.append('username', data.username);
    formData.append('birthDate', data.birthDate);
    formData.append('password', data.password);

    if (data.nroTelefono !== undefined && data.nroTelefono !== null) {
      formData.append('nroTelefono', String(data.nroTelefono));
    }

    if (data.foto) {
      formData.append('foto', data.foto as any);
    }

    const response = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || 'Error al registrar la cuenta');
    }

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

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || 'Error al cambiar la contraseña');
    }
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