import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface User {
  id: string;
  email: string;
  nombre?: string;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthDate: string;
  password: string;
  nroTelefono?: number;
  foto?: string | File;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  signIn: (tokens: { accessToken: string; refreshToken: string }, user: User) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
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

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedUser = await tokenStorage.getUser();
        const token = await tokenStorage.getAccessToken();
        if (savedUser && token) {
          setUser(savedUser);
        }
      } catch (error) {
        console.error('Error al restaurar la sesión:', error);
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
  };

  const signUp = async (data: SignUpData) => {
    const formData = new FormData();
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    formData.append('email', data.email);
    formData.append('username', data.username);
    formData.append('birthDate', data.birthDate);
    formData.append('password', data.password);
    if (data.nroTelefono) {
      formData.append('nroTelefono', String(data.nroTelefono));
    }
    if (data.foto) {
      formData.append('foto', data.foto);
    }

    const response = await fetch('YOUR_API_URL/auth/signup', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error durante el registro');
    }

    const responseData = await response.json();
    const { accessToken, refreshToken, user: userData } = responseData;

    await tokenStorage.saveTokens(accessToken, refreshToken);
    await tokenStorage.saveUser(userData);
    setUser(userData);
  };

  const signOut = async () => {
    await tokenStorage.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);