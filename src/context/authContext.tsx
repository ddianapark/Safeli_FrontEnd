import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router, RelativePathString } from 'expo-router';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';
import { authEvents } from '../app/apiClient';
import { AuthContextType, LoginRequest, SignUpRequest, User, MapRequest } from '../types/auth_types';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ─── Force-logout listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = authEvents.onForceLogout(async () => {
      setUser(null);
      router.replace('/');
    });
    return unsubscribe;
  }, []);

  // ─── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const rememberMe = await tokenStorage.getRememberMe();
        const accessToken = await tokenStorage.getAccessToken();

        if (!rememberMe || !accessToken) {
          await tokenStorage.clearTokens();
          return;
        }
        const freshUser = await authService.getMe();
        setUser(freshUser);

        await tokenStorage.saveUser(JSON.stringify(freshUser));
      } catch {
        await tokenStorage.clearTokens();
        await tokenStorage.clearRememberMe();
        await tokenStorage.clearUser();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      await tokenStorage.saveUser(JSON.stringify(freshUser));
    } catch {
      await tokenStorage.clearTokens();
      await tokenStorage.clearRememberMe();
      await tokenStorage.clearUser();
      setUser(null);
      router.replace('/');
    }
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<void> => {
    const response = await authService.login(data);
    await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
    await tokenStorage.saveUser(JSON.stringify(response.user));
    await tokenStorage.setRememberMe(data.rememberMe);
    setUser(response.user);
    router.replace('/home' as RelativePathString);
  }, []);

  const signUp = useCallback(async (data: SignUpRequest): Promise<void> => {
    const response = await authService.signUp(data);
    await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
    await tokenStorage.saveUser(JSON.stringify(response.user));
    await tokenStorage.setRememberMe(false);
    setUser(response.user);
    router.replace('/home' as RelativePathString);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
    } finally {
      await tokenStorage.clearTokens();
      await tokenStorage.clearRememberMe();
      await tokenStorage.clearUser();
      setUser(null);
      router.replace('/');
    }
  }, []);

  const map = useCallback(async (data: MapRequest): Promise<void> => {
    try {
      await (authService as any).map(data);
    } catch (error) {
      console.error('Error en map:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signUp,
        logout,
        map,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};