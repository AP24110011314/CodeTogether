import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const SYSTEM_INSTRUCTION = `You are a patient, encouraging, and highly skilled computer science tutor and mentor on CodeTogether, a real-time collaborative coding platform.
Your goals:
1. Explain concepts step by step in clear, accessible terms.
2. Provide guiding hints and conceptual direction before giving away full answers or complete solutions.
3. Ask short check-for-understanding questions to reinforce learning and stimulate critical thinking.
4. When writing code, provide concise, clean examples formatted in Markdown with language syntax identifiers (e.g. \`\`\`javascript, \`\`\`python).
5. Always explain the "why" behind design decisions, data structures, and asymptotic Time & Space complexity (Big-O: $O(1)$, $O(n)$, $O(\\log n)$, etc.).
6. When code context is provided, reference specific elements, variables, loops, or logic from the student's code to make your feedback directly relevant.
7. Maintain a warm, encouraging, and collaborative tone at all times.`;

let genAiClient = null;

function getClient() {
  if (!env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return genAiClient;
}

/**
 * Generate a response from the Gemini AI Tutor.
 *
 * @param {Object} params
 * @param {string} params.message - Latest user prompt
 * @param {Array<{role: string, text: string}>} [params.history] - Recent conversation history
 * @param {Object} [params.context] - Code context { code?: string, language?: string, topic?: string }
 * @returns {Promise<{ reply: string, model: string }>}
 */
export async function generateTutorReply({ message, history = [], context = {} }) {
  if (!env.GEMINI_API_KEY) {
    const error = new Error('AI Tutor is not configured. GEMINI_API_KEY is missing on the server.');
    error.code = 'AI_NOT_CONFIGURED';
    error.status = 503;
    throw error;
  }

  const ai = getClient();
  const modelName = env.GEMINI_MODEL || 'gemini-3.5-flash';

  // Construct contents with history
  const contents = [];

  // Map history turns (normalize role 'assistant' -> 'model')
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (!turn || !turn.text) continue;
      const role = turn.role === 'assistant' || turn.role === 'model' || turn.role === 'ai' ? 'model' : 'user';
      contents.push({
        role,
        parts: [{ text: turn.text }],
      });
    }
  }

  // Construct the final user prompt with code context if supplied
  let userPrompt = message;
  const contextParts = [];

  if (context.language) {
    contextParts.push(`Language: ${context.language}`);
  }
  if (context.topic) {
    contextParts.push(`Topic/Problem: ${context.topic}`);
  }
  if (context.code && context.code.trim().length > 0) {
    const codeSnippet = context.code.slice(0, 10000); // Guard max code context length
    contextParts.push(`Current Code:\n\`\`\`${context.language || ''}\n${codeSnippet}\n\`\`\``);
  }

  if (contextParts.length > 0) {
    userPrompt = `[Context Information]\n${contextParts.join('\n\n')}\n\n[Student Question / Prompt]\n${message}`;
  }

  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }],
  });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'I have analyzed your code. How can I guide you further?';
    return {
      reply,
      model: modelName,
    };
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const errMsg = String(err.message || '');

    logger.error(
      {
        status,
        model: modelName,
        error: errMsg.replace(env.GEMINI_API_KEY, '[REDACTED]'),
      },
      'Gemini AI Tutor generation error'
    );

    let userFacingMessage = 'The AI Tutor encountered an unexpected issue. Please try again.';
    let errorCode = 'AI_ERROR';
    let httpStatus = 500;

    if (status === 429 || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      userFacingMessage = 'AI Tutor rate limit or quota exceeded. Please wait a moment before asking again.';
      errorCode = 'AI_RATE_LIMIT';
      httpStatus = 429;
    } else if (status === 404 || errMsg.includes('NOT_FOUND') || errMsg.includes('no longer available')) {
      userFacingMessage = `The configured AI model (${modelName}) is unavailable. Please check GEMINI_MODEL in server .env.`;
      errorCode = 'AI_MODEL_NOT_FOUND';
      httpStatus = 503;
    } else if (status === 503 || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
      userFacingMessage = 'The AI Tutor is currently experiencing high demand. Please try again in a few moments.';
      errorCode = 'AI_SERVICE_UNAVAILABLE';
      httpStatus = 503;
    } else if (errMsg.includes('SAFETY') || errMsg.includes('blocked')) {
      userFacingMessage = 'Your request or the response was flagged by safety guidelines. Please rephrase your question.';
      errorCode = 'AI_SAFETY_BLOCKED';
      httpStatus = 400;
    } else if (status === 401 || status === 403 || errMsg.includes('API_KEY_INVALID')) {
      userFacingMessage = 'Invalid Gemini API key or API not enabled in Google AI Studio.';
      errorCode = 'AI_AUTH_ERROR';
      httpStatus = 500;
    }

    const wrappedError = new Error(userFacingMessage);
    wrappedError.code = errorCode;
    wrappedError.status = httpStatus;
    throw wrappedError;
  }
}

