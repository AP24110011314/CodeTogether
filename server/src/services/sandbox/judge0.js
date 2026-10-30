import { env } from '../../config/env.js';
import logger from '../../utils/logger.js';

// Judge0 language IDs (CE standard mapping)
const JUDGE0_LANGUAGE_IDS = {
  javascript: 93, // Node.js 18.15.0 (or fallback 63)
  python: 92, // Python 3.11.2 (or fallback 71)
  typescript: 94, // TypeScript 5.0.3 (or fallback 74)
  c: 50, // C (GCC 9.2.0)
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13.0.1)
  go: 95, // Go 1.18.5 (or fallback 60)
};

export async function runJudge0({ language, code, stdin = '' }) {
  const langKey = language?.toLowerCase().trim();
  const languageId = JUDGE0_LANGUAGE_IDS[langKey];

  if (!languageId) {
    return {
      status: 'rejected',
      stdout: '',
      stderr: `Unsupported language for Judge0: ${language}`,
      exitCode: null,
      durationMs: 0,
      truncated: false,
    };
  }

  if (!env.JUDGE0_URL) {
    return {
      status: 'error',
      stdout: '',
      stderr: 'Judge0 executor is selected but JUDGE0_URL is not configured.',
      exitCode: 1,
      durationMs: 0,
      truncated: false,
    };
  }

  const startTime = Date.now();
  const url = `${env.JUDGE0_URL.replace(/\/+$/, '')}/submissions?base64_encoded=false&wait=true`;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (env.JUDGE0_KEY) {
    headers['X-Auth-Token'] = env.JUDGE0_KEY;
    headers['X-RapidAPI-Key'] = env.JUDGE0_KEY;
  }

  const payload = {
    language_id: languageId,
    source_code: code,
    stdin,
    cpu_time_limit: Math.ceil((env.RUN_TIMEOUT_MS || 5000) / 1000),
    memory_limit: (env.RUN_MEMORY_MB || 256) * 1024,
    max_file_size: 64,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        status: 'error',
        stdout: '',
        stderr: `Judge0 error HTTP ${res.status}: ${errText}`,
        exitCode: 1,
        durationMs: Date.now() - startTime,
        truncated: false,
      };
    }

    const data = await res.json();
    const durationMs = data.time ? Math.round(parseFloat(data.time) * 1000) : Date.now() - startTime;

    // Judge0 status IDs:
    // 3: Accepted
    // 4: Wrong Answer
    // 5: Time Limit Exceeded
    // 6: Compilation Error
    // 7-12: Runtime Error
    // 13: Internal Error
    // 14: Exec Format Error
    let status = 'success';
    const statusId = data.status?.id;

    if (statusId === 3) {
      status = 'success';
    } else if (statusId === 5) {
      status = 'timeout';
    } else if (statusId === 6 || (statusId >= 7 && statusId <= 14)) {
      status = 'error';
    } else if (statusId !== undefined) {
      status = 'error';
    }

    let stderr = '';
    if (data.compile_output) {
      stderr += data.compile_output;
    }
    if (data.stderr) {
      stderr += (stderr ? '\n' : '') + data.stderr;
    }

    const stdout = data.stdout || '';
    const maxBytes = (env.RUN_OUTPUT_LIMIT_KB || 64) * 1024;
    const truncated = stdout.length > maxBytes || stderr.length > maxBytes;

    return {
      status,
      stdout: stdout.slice(0, maxBytes),
      stderr: stderr.slice(0, maxBytes),
      exitCode: data.exit_code ?? (status === 'success' ? 0 : 1),
      durationMs,
      truncated,
    };
  } catch (err) {
    logger.error({ err }, 'Failed to communicate with Judge0');
    return {
      status: 'error',
      stdout: '',
      stderr: `Judge0 execution error: ${err.message}`,
      exitCode: 1,
      durationMs: Date.now() - startTime,
      truncated: false,
    };
  }
}
