import { env } from './env.js';

/**
 * Validates if an incoming request Origin is permitted by CORS.
 * Permits:
 * 1. env.CLIENT_URL (with or without trailing slash)
 * 2. Vercel deployment domains (*.vercel.app for production and previews)
 * 3. Localhost development (http://localhost:5173)
 * 4. Non-browser callers (curl, health checks, server-to-server) where origin is undefined
 */
export function isOriginAllowed(origin) {
  if (!origin) return true;

  const normalizedOrigin = origin.trim().replace(/\/+$/, '');
  const configuredOrigin = env.CLIENT_URL ? env.CLIENT_URL.trim().replace(/\/+$/, '') : '';

  if (normalizedOrigin === configuredOrigin) {
    return true;
  }

  // Allow all Vercel domains (*.vercel.app)
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch {
    // Invalid URL structure
  }

  // Allow local development clients
  if (
    normalizedOrigin === 'http://localhost:5173' ||
    normalizedOrigin === 'http://127.0.0.1:5173'
  ) {
    return true;
  }

  return false;
}

export function corsOriginDelegate(origin, callback) {
  if (isOriginAllowed(origin)) {
    return callback(null, true);
  }
  return callback(null, false);
}
