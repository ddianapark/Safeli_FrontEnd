import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router, RelativePathString } from 'expo-router';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';
import { authEvents } from '../app/apiClient';
import { AuthContextType, LoginRequest, SignUpRequest, User, MapRequest } from '../types/auth.types';

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
  // Revalida la sesión contra el backend en cada inicio de app.
  // Si hay token + rememberMe → llama /auth/me para traer datos frescos.
  // Si /auth/me falla (token vencido, red caída, etc.) → limpia y manda al login.
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const rememberMe = await tokenStorage.getRememberMe();
        const accessToken = await tokenStorage.getAccessToken();

        if (!rememberMe || !accessToken) {
          // Sin "recordarme" activo o sin token → limpiamos y vamos al login
          await tokenStorage.clearTokens();
          return;
        }

        // Token existe: revalidamos contra el backend
        // El interceptor de apiClient adjunta el Bearer automáticamente
        // y hace el refresh si está por vencer.
        const freshUser = await authService.getMe();
        setUser(freshUser);

        // Actualizamos el usuario cacheado con los datos frescos del backend
        await tokenStorage.saveUser(JSON.stringify(freshUser));
      } catch {
        // Token inválido, vencido, o sin red — limpiamos todo
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

  // revalida y actualiza datos del usuario desde el backend
  // Útil para después de editar perfil, o al volver a primer plano
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      await tokenStorage.saveUser(JSON.stringify(freshUser));
    } catch {
      // Si falla la revalidación, la forzamos al login
      await tokenStorage.clearTokens();
      await tokenStorage.clearRememberMe();
      await tokenStorage.clearUser();
      setUser(null);
      router.replace('/');
    }
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<void> => {
    // authService.login ya lanza errores con mensajes del backend
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
      // best-effort: si el server falla limpiamos localmente igual
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