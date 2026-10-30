import { create } from 'zustand';
import { registerApi, loginApi, refreshApi, logoutApi, getMeApi } from '../api/auth.js';
import { setAuthStoreGetter } from '../api/http.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  setAccessToken: (accessToken) => set({ accessToken }),

  clearAuth: () => set({ user: null, accessToken: null, error: null }),

  register: async ({ name, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await registerApi({ name, email, password });
      set({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false,
        error: null,
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
      set({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false,
        error: null,
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
      set({ user: null, accessToken: null, isLoading: false, error: null });
    }
  },

  initAuth: async () => {
    if (get().isInitialized) return;
    try {
      const refreshData = await refreshApi();
      set({ accessToken: refreshData.accessToken });
      const meData = await getMeApi();
      set({ user: meData.user, isInitialized: true });
    } catch (err) {
      set({ user: null, accessToken: null, isInitialized: true });
    }
  },
}));

// Wire store to axios interceptor
setAuthStoreGetter(() => useAuthStore.getState());

