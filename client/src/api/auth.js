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
  const response = await http.post('/auth/refresh');
  return response.data;
}

export async function logoutApi() {
  const response = await http.post('/auth/logout');
  return response.data;
}

export async function getMeApi() {
  const response = await http.get('/auth/me');
  return response.data;
}

