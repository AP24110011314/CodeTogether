import { http } from './http.js';

export async function registerApi(data) {
  const response = await http.post('/auth/register', data);
  return response.data;
}

export async function loginApi(data) {
  const response = await http.post('/auth/login', data);
  return response.data;
}

export async function refreshApi() {
  const storedToken = typeof window !== 'undefined'
    ? localStorage.getItem('codetogether_refresh_token')
    : null;
  const response = await http.post('/auth/refresh', { refreshToken: storedToken });
  return response.data;
}

export async function logoutApi() {
  const storedToken = typeof window !== 'undefined'
    ? localStorage.getItem('codetogether_refresh_token')
    : null;
  const response = await http.post('/auth/logout', { refreshToken: storedToken });
  return response.data;
}

export async function getMeApi() {
  const response = await http.get('/auth/me');
  return response.data;
}

