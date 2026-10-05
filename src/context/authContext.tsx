import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import type { ChangePasswordRequest, UpdateProfileRequest, User } from '../types/auth_types';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (tokens: { accessToken: string; refreshToken: string }, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest | FormData) => Promise<User>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
}

// Helper seguro para persistencia multiplataforma
export const tokenStorage = {
  getAccessToken: async (): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem('safeli_access_token');
    return await SecureStore.getItemAsync('safeli_access_token');
  },
  getRefreshToken: async (): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem('safeli_refresh_token');
    return await SecureStore.getItemAsync('safeli_refresh_token');
  },
  saveTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem('safeli_access_token', accessToken);
      localStorage.setItem('safeli_refresh_token', refreshToken);
    } else {
      await SecureStore.setItemAsync('safeli_access_token', accessToken);
      await SecureStore.setItemAsync('safeli_refresh_token', refreshToken);
    }
  },
  clearTokens: async (): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('safeli_access_token');
      localStorage.removeItem('safeli_refresh_token');
      localStorage.removeItem('safeli_user');
    } else {
      await SecureStore.deleteItemAsync('safeli_access_token');
      await SecureStore.deleteItemAsync('safeli_refresh_token');
      await SecureStore.deleteItemAsync('safeli_user');
    }
  },
  getUser: async (): Promise<User | null> => {
    const raw = Platform.OS === 'web'
      ? localStorage.getItem('safeli_user')
      : await SecureStore.getItemAsync('safeli_user');
    return raw ? JSON.parse(raw) : null;
  },
  saveUser: async (user: User): Promise<void> => {
    const stringified = JSON.stringify(user);
    if (Platform.OS === 'web') {
      localStorage.setItem('safeli_user', stringified);
    } else {
      await SecureStore.setItemAsync('safeli_user', stringified);
    }
  }
};

const defaultAuthContext: AuthContextData = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => undefined,
  signOut: async () => undefined,
  logout: async () => undefined,
  updateProfile: async () => ({ id: 0, username: '', email: '', firstName: '', lastName: '' }),
  changePassword: async () => undefined,
};

const AuthContext = createContext<AuthContextData>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedUser = await tokenStorage.getUser();
        const token = await tokenStorage.getAccessToken();
        const hasSession = Boolean(savedUser && token);

        setUser(hasSession ? savedUser : null);
        setIsAuthenticated(hasSession);
      } catch (error) {
        console.error('Error al restaurar la sesión:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const signIn = async (tokens: { accessToken: string; refreshToken: string }, userData: User) => {
    await tokenStorage.saveTokens(tokens.accessToken, tokens.refreshToken);
    await tokenStorage.saveUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const signOut = async () => {
    await tokenStorage.clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  };

  const logout = async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.warn('No se pudo cerrar sesión en el backend:', error);
    } finally {
      await signOut();
    }
  };

  const updateProfile = async (data: UpdateProfileRequest | FormData): Promise<User> => {
    const updatedUser = await authService.updateProfile(data);
    await tokenStorage.saveUser(updatedUser);
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    await authService.changePassword(data);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, signIn, signOut, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);