import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';
import { AuthContextType, LoginRequest, SignUpRequest, User } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On app start: check if a valid token exists (and "remember me" is active)
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const rememberMe = await tokenStorage.getRememberMe();
        const accessToken = await tokenStorage.getAccessToken();

        if (rememberMe && accessToken) {
          // TODO: Optionally call a /auth/me endpoint to rehydrate user data
          // For now we keep the session alive without re-fetching the user object
        } else if (!rememberMe) {
          // "Remember me" was not checked — clear tokens on app restart
          await tokenStorage.clearTokens();
        }
      } catch {
        await tokenStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<void> => {
    const response = await authService.login(data);
    await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
    await tokenStorage.setRememberMe(data.rememberMe);
    setUser(response.user);
    router.replace('/(tabs)');
  }, []);

  const signUp = useCallback(async (data: SignUpRequest): Promise<void> => {
    const response = await authService.signUp(data);
    await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
    await tokenStorage.setRememberMe(false);
    setUser(response.user);
    router.replace('/(tabs)');
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Even if the server call fails, we clear local state
    } finally {
      await tokenStorage.clearTokens();
      await tokenStorage.clearRememberMe();
      setUser(null);
      router.replace('/');
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