import { http } from './http.js';

export async function getRoomMessagesApi(roomId, params = {}) {
  const response = await http.get(`/rooms/${roomId}/messages`, { params });
  return response.data;
}
