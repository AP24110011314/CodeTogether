import axios from 'axios';

export function getBaseApiUrl() {
  let url = import.meta.env.VITE_API_URL;
  if (!url) {
    return 'http://localhost:4000/api';
  }
  url = url.trim().replace(/\/+$/, '');
  // Normalize if user omitted /api
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
}

const API_BASE_URL = getBaseApiUrl();

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Will be initialized with authStore to avoid circular dependency
let getAuthStoreState = () => null;

export const setAuthStoreGetter = (getter) => {
  getAuthStoreState = getter;
};

http.interceptors.request.use(
  (config) => {
    const store = getAuthStoreState();
    const token = store?.accessToken;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth endpoints or if already retried
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register') ||
      originalRequest.url.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return http(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = typeof window !== 'undefined'
        ? localStorage.getItem('codetogether_refresh_token')
        : null;

      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: storedRefreshToken },
        { withCredentials: true, timeout: 15000 }
      );
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('codetogether_access_token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('codetogether_refresh_token', newRefreshToken);
        }
      }

      const store = getAuthStoreState();
      if (store?.setAccessToken) {
        store.setAccessToken(accessToken);
      }

      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('codetogether_access_token');
        localStorage.removeItem('codetogether_refresh_token');
        localStorage.removeItem('codetogether_user_cache');
      }
      processQueue(refreshError, null);
      const store = getAuthStoreState();
      if (store?.clearAuth) {
        store.clearAuth();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

