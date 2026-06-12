import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'safeli_access_token';
const REFRESH_TOKEN_KEY = 'safeli_refresh_token';
const REMEMBER_ME_KEY = 'safeli_remember_me';

// ─── Platform-aware storage ───────────────────────────────────────────────────
// expo-secure-store doesn't support web; fall back to localStorage on web.
const storage = {
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async delete(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const tokenStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await storage.set(ACCESS_TOKEN_KEY, accessToken);
    await storage.set(REFRESH_TOKEN_KEY, refreshToken);
  },

  async getAccessToken(): Promise<string | null> {
    return storage.get(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return storage.get(REFRESH_TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    await storage.delete(ACCESS_TOKEN_KEY);
    await storage.delete(REFRESH_TOKEN_KEY);
  },

  async setRememberMe(value: boolean): Promise<void> {
    await storage.set(REMEMBER_ME_KEY, JSON.stringify(value));
  },

  async getRememberMe(): Promise<boolean> {
    const value = await storage.get(REMEMBER_ME_KEY);
    return value ? JSON.parse(value) : false;
  },

  async clearRememberMe(): Promise<void> {
    await storage.delete(REMEMBER_ME_KEY);
  },
};