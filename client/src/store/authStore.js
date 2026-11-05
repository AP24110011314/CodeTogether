import { create } from 'zustand';
import { registerApi, loginApi, refreshApi, logoutApi, getMeApi } from '../api/auth.js';
import { setAuthStoreGetter } from '../api/http.js';

const TOKEN_KEY = 'codetogether_access_token';
const REFRESH_KEY = 'codetogether_refresh_token';
const USER_KEY = 'codetogether_user_cache';

const storage = {
  get: (key) => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  set: (key, val) => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(key, val);
    } catch {}
  },
  remove: (key) => {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem(key);
    } catch {}
  },
};

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: storage.get(TOKEN_KEY),
  isLoading: false,
  isInitialized: false,
  error: null,

  setAccessToken: (accessToken) => {
    if (accessToken) {
      storage.set(TOKEN_KEY, accessToken);
    } else {
      storage.remove(TOKEN_KEY);
    }
    set({ accessToken });
  },

  clearAuth: () => {
    storage.remove(TOKEN_KEY);
    storage.remove(REFRESH_KEY);
    storage.remove(USER_KEY);
    set({ user: null, accessToken: null, error: null });
  },

  register: async ({ name, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await registerApi({ name, email, password });
      storage.set(TOKEN_KEY, data.accessToken);
      if (data.refreshToken) storage.set(REFRESH_KEY, data.refreshToken);
      if (data.user) storage.set(USER_KEY, JSON.stringify(data.user));

      set({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false,
        error: null,
        isInitialized: true,
      });
      return data;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Registration failed';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await loginApi({ email, password });
      storage.set(TOKEN_KEY, data.accessToken);
      if (data.refreshToken) storage.set(REFRESH_KEY, data.refreshToken);
      if (data.user) storage.set(USER_KEY, JSON.stringify(data.user));

      set({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false,
        error: null,
        isInitialized: true,
      });
      return data;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Invalid email or password';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutApi();
    } catch (err) {
      console.warn('Logout request warning:', err);
    } finally {
      storage.remove(TOKEN_KEY);
      storage.remove(REFRESH_KEY);
      storage.remove(USER_KEY);
      set({ user: null, accessToken: null, isLoading: false, error: null });
    }
  },

  initAuth: async () => {
    if (get().isInitialized) return;

    const savedToken = storage.get(TOKEN_KEY);
    const savedUserStr = storage.get(USER_KEY);
    let cachedUser = null;
    if (savedUserStr) {
      try {
        cachedUser = JSON.parse(savedUserStr);
      } catch {}
    }

    // Fast Path: If no stored token and no refresh token, this is an unauthenticated visitor.
    // Immediately finish initialization without waiting for any network calls!
    const savedRefreshToken = storage.get(REFRESH_KEY);
    if (!savedToken && !savedRefreshToken) {
      set({ user: null, accessToken: null, isInitialized: true });
      return;
    }

    // Hydrate existing token into state immediately
    if (savedToken) {
      set({ accessToken: savedToken, user: cachedUser });
      try {
        const meData = await getMeApi();
        storage.set(USER_KEY, JSON.stringify(meData.user));
        set({ user: meData.user, isInitialized: true });
        return;
      } catch (err) {
        // Token might be expired, fall through to refresh
      }
    }

    // Attempt token refresh
    try {
      const refreshData = await refreshApi();
      storage.set(TOKEN_KEY, refreshData.accessToken);
      if (refreshData.refreshToken) {
        storage.set(REFRESH_KEY, refreshData.refreshToken);
      }
      set({ accessToken: refreshData.accessToken });

      const meData = await getMeApi();
      storage.set(USER_KEY, JSON.stringify(meData.user));
      set({ user: meData.user, isInitialized: true });
    } catch (err) {
      // Both access token and refresh failed
      storage.remove(TOKEN_KEY);
      storage.remove(REFRESH_KEY);
      storage.remove(USER_KEY);
      set({ user: null, accessToken: null, isInitialized: true });
    }
  },
}));

// Wire store to axios interceptor
setAuthStoreGetter(() => useAuthStore.getState());
