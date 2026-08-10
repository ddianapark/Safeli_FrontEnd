import { RelativePathString, router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authEvents } from '../app/apiClient';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';
import { AuthContextType, ChangePasswordRequest, LoginRequest, MapRequest, SignUpRequest, UpdateProfileRequest, User } from '../types/auth_types';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);

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
        const accessToken = await tokenStorage.getAccessToken();

        if (!accessToken) {
          await tokenStorage.clearTokens();
          setUser(null);
          return;
        }
        const freshUser = await authService.getMe();
        setUser(freshUser);
        setToken(accessToken);

        await tokenStorage.saveUser(JSON.stringify(freshUser));
      } catch {
        await tokenStorage.clearTokens();
        await tokenStorage.clearRememberMe();
        await tokenStorage.clearUser();
        setUser(null);
        setToken(null);
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
    setToken(response.accessToken);
    router.replace('/home' as RelativePathString);
  }, []);

  const signUp = useCallback(async (data: SignUpRequest): Promise<void> => {
    await authService.signUp(data);
    await tokenStorage.clearTokens();
    await tokenStorage.clearRememberMe();
    await tokenStorage.clearUser();
    setUser(null);
    setToken(null);
    router.replace('/' as RelativePathString);
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
      setToken(null);
      router.replace('/');
    }
  }, []);

const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<User> => {
    const updatedUser = await authService.updateProfile(data);

    // Unimos los datos anteriores con los nuevos para NO perder propiedades clave
    setUser((prevUser) => {
      const mergedUser = {
        ...prevUser,
        ...updatedUser,
      } as User;

      // Guardamos la versión completa en el almacenamiento local
      tokenStorage.saveUser(JSON.stringify(mergedUser)).catch(console.error);
      return mergedUser;
    });

    return updatedUser;
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordRequest): Promise<void> => {
    await authService.changePassword(data);
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
        updateProfile,
        changePassword,
        token,
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