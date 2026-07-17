import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'safeli_access_token';
const REFRESH_TOKEN_KEY = 'safeli_refresh_token';
const REMEMBER_ME_KEY = 'safeli_remember_me';
const USER_KEY = 'safeli_user';
const MOCK_USERS_KEY = 'safeli_mock_users';

// ─── Platform-aware storage ───────────────────────────────────────────────────
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
  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await storage.set(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken !== undefined && refreshToken !== null && refreshToken !== '') {
      await storage.set(REFRESH_TOKEN_KEY, refreshToken);
    }
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

  async saveUser(userJson: string): Promise<void> {
    await storage.set(USER_KEY, userJson);
  },

  async getUser(): Promise<string | null> {
    return storage.get(USER_KEY);
  },

  async clearUser(): Promise<void> {
    await storage.delete(USER_KEY);
  },

  async saveMockUser(userJson: string): Promise<void> {
    const existing = await storage.get(MOCK_USERS_KEY);
    const users = existing ? JSON.parse(existing) : [];
    const user = JSON.parse(userJson);
    const idx = users.findIndex((u: any) => u.username === user.username || u.email === user.email);
    if (idx > -1) users[idx] = { ...users[idx], ...user };
    else users.push(user);
    await storage.set(MOCK_USERS_KEY, JSON.stringify(users));
  },

  async getMockUsers(): Promise<any[]> {
    const raw = await storage.get(MOCK_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async clearMockUsers(): Promise<void> {
    await storage.delete(MOCK_USERS_KEY);
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