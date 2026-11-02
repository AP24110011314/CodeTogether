import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { env } from '../src/config/env.js';

async function main() {
  console.log('--- CodeTogether AI Tutor Diagnostics ---');
  console.log('Environment:', env.NODE_ENV);
  console.log('Model target:', env.GEMINI_MODEL);

  if (!env.GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY is not set in server/.env');
    console.error('Please add GEMINI_API_KEY=<your-key> to server/.env and retry.');
    process.exit(1);
  }

  console.log('API Key detected (length: ' + env.GEMINI_API_KEY.length + ' chars)');
  console.log('Connecting to Google Gemini API via official @google/genai SDK...');

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const startTime = Date.now();

    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: 'Respond with a short educational welcome message (under 30 words) for CodeTogether students.',
      config: {
        systemInstruction: 'You are an encouraging computer science tutor on CodeTogether.',
      },
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Success! Response received in ${elapsed}ms:`);
    console.log('----------------------------------------------------');
    console.log(response.text.trim());
    console.log('----------------------------------------------------');
    console.log('AI Tutor is operational and ready to assist learners.');
  } catch (err) {
    console.error('❌ AI Tutor test failed:');
    console.error(err.message || err);
    process.exit(1);
  }
}

main();

