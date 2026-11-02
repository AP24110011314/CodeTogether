import { http } from './http.js';

/**
 * Send a message and optional context/history to the AI Tutor.
 *
 * @param {Object} payload
 * @param {string} payload.message - Prompt for the tutor
 * @param {Array<{role: string, text: string}>} [payload.history] - Conversation history
 * @param {Object} [payload.context] - Code context { code?: string, language?: string, topic?: string }
 * @returns {Promise<{ reply: string, model: string }>}
 */
export async function askAiTutorApi({ message, history, context }) {
  const response = await http.post('/ai-tutor/chat', {
    message,
    history,
    context,
  });
  return response.data;
}

