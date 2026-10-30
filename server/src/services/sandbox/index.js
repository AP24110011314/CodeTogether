import { env } from '../../config/env.js';
import { runLocal } from './runner.js';
import { runJudge0 } from './judge0.js';
import { getAvailableLanguages, isLanguageAvailable } from './languages.js';

export async function execute({ language, code, stdin = '' }) {
  if (env.EXECUTOR === 'judge0') {
    return runJudge0({ language, code, stdin });
  }
  return runLocal({ language, code, stdin });
}

export { getAvailableLanguages, isLanguageAvailable };
