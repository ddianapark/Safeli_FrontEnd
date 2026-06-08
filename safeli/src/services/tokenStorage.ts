import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'safeli_access_token';
const REFRESH_TOKEN_KEY = 'safeli_refresh_token';
const REMEMBER_ME_KEY = 'safeli_remember_me';

export const tokenStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },

  async setRememberMe(value: boolean): Promise<void> {
    await SecureStore.setItemAsync(REMEMBER_ME_KEY, JSON.stringify(value));
  },

  async getRememberMe(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
    return value ? JSON.parse(value) : false;
  },

  async clearRememberMe(): Promise<void> {
    await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
  },
};