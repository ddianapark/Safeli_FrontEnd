import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router, RelativePathString } from 'expo-router';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';
import { authEvents } from '../app/apiClient';
import { AuthContextType, LoginRequest, SignUpRequest, User, MapRequest} from '../types/auth.types';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ─── Force-logout listener ──────────────────────────────────────────────────
  // Cuando el refresh token expira, apiClient emite este evento.
  // Limpiamos el estado sin intentar llamar al backend (ya sabemos que falló).
  useEffect(() => {
    const unsubscribe = authEvents.onForceLogout(async () => {
      setUser(null);
      router.replace('/');
    });
    return unsubscribe;
  }, []);

  // ─── Bootstrap ──────────────────────────────────────────────────────────────
  // Al iniciar la app: si hay token + rememberMe, intentamos rehydratar el usuario
  // con GET /auth/me. Si falla (token vencido, red, etc.) limpiamos todo.
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const rememberMe = await tokenStorage.getRememberMe();
        const accessToken = await tokenStorage.getAccessToken();

        if (rememberMe && accessToken) {
          // El interceptor adjuntará el Bearer token automáticamente
          const me = await authService.getMe();
          setUser(me);
        } else if (!rememberMe) {
          // "Recordarme" no estaba activo — la sesión no persiste entre reinicios
          await tokenStorage.clearTokens();
        }
      } catch {
        // Token inválido o vencido (el interceptor ya intentó el refresh)
        await tokenStorage.clearTokens();
        await tokenStorage.clearRememberMe();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  // ─── Auth actions ────────────────────────────────────────────────────────────
  const login = useCallback(async (data: LoginRequest): Promise<void> => {
    const response = await authService.login(data);
    await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
    // Persist user for offline/mock scenarios
    await tokenStorage.saveUser(JSON.stringify(response.user));
    await tokenStorage.setRememberMe(data.rememberMe);
    setUser(response.user);
    router.replace('/home' as RelativePathString);
  }, []);

  const signUp = useCallback(async (data: SignUpRequest): Promise<void> => {
    const response = await authService.signUp(data);
    await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
    // Persist user for offline/mock scenarios
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
      // Si el server falla, igual limpiamos localmente
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