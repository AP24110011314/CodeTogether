import { http } from './http.js';

export async function getLanguagesApi() {
  const response = await http.get('/runs/languages');
  return response.data;
}

export async function getRoomRunsApi(roomId, limit = 20) {
  const response = await http.get(`/rooms/${roomId}/runs`, {
    params: { limit },
  });
  return response.data;
}

export async function getRunByIdApi(runId) {
  const response = await http.get(`/runs/${runId}`);
  return response.data;
}

