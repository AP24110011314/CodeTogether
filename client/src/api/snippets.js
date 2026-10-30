import { http } from './http.js';

export async function createSnippetApi(data) {
  const response = await http.post('/snippets', data);
  return response.data;
}

export async function getSnippetsApi(params = {}) {
  const response = await http.get('/snippets', { params });
  return response.data;
}

export async function getSnippetByIdApi(id) {
  const response = await http.get(`/snippets/${id}`);
  return response.data;
}

export async function updateSnippetApi(id, data) {
  const response = await http.patch(`/snippets/${id}`, data);
  return response.data;
}

export async function deleteSnippetApi(id) {
  const response = await http.delete(`/snippets/${id}`);
  return response.data;
}

