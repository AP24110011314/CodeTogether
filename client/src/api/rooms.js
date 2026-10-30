import { http } from './http.js';

export async function createRoomApi(data) {
  const response = await http.post('/rooms', data);
  return response.data;
}

export async function getRoomsApi(scope) {
  const response = await http.get('/rooms', {
    params: scope ? { scope } : {},
  });
  return response.data;
}

export async function getRoomBySlugApi(slug, query = {}) {
  const response = await http.get(`/rooms/${slug}`, {
    params: query,
  });
  return response.data;
}

export async function updateRoomApi(id, data) {
  const response = await http.patch(`/rooms/${id}`, data);
  return response.data;
}

export async function deleteRoomApi(id) {
  const response = await http.delete(`/rooms/${id}`);
  return response.data;
}

export async function regenerateInviteApi(id) {
  const response = await http.post(`/rooms/${id}/invite/regenerate`);
  return response.data;
}

export async function joinRoomApi(data) {
  const response = await http.post('/rooms/join', data);
  return response.data;
}

export async function updateMemberRoleApi(id, userId, role) {
  const response = await http.patch(`/rooms/${id}/members/${userId}`, { role });
  return response.data;
}

export async function removeMemberApi(id, userId) {
  const response = await http.delete(`/rooms/${id}/members/${userId}`);
  return response.data;
}
