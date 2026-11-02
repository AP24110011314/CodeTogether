import { describe, it, expect } from 'vitest';
import { isOriginAllowed, corsOriginDelegate } from '../src/config/cors.js';
import { env } from '../src/config/env.js';

describe('CORS Origin Delegate for Cloud Deployment (Vercel & Render)', () => {
  it('allows non-browser requests without origin header', () => {
    expect(isOriginAllowed(undefined)).toBe(true);
    expect(isOriginAllowed(null)).toBe(true);
    expect(isOriginAllowed('')).toBe(true);
  });

  it('allows exact configured CLIENT_URL and with trailing slash', () => {
    expect(isOriginAllowed(env.CLIENT_URL)).toBe(true);
    expect(isOriginAllowed(`${env.CLIENT_URL}/`)).toBe(true);
  });

  it('allows Vercel production and preview deployment domains (*.vercel.app)', () => {
    expect(isOriginAllowed('https://codetogether.vercel.app')).toBe(true);
    expect(isOriginAllowed('https://codetogether-preview-branch.vercel.app')).toBe(true);
    expect(isOriginAllowed('https://my-team-project-123.vercel.app/')).toBe(true);
  });

  it('allows local dev origin http://localhost:5173', () => {
    expect(isOriginAllowed('http://localhost:5173')).toBe(true);
    expect(isOriginAllowed('http://127.0.0.1:5173')).toBe(true);
  });

  it('rejects unallowed third-party origins', () => {
    expect(isOriginAllowed('https://malicious-site.com')).toBe(false);
    expect(isOriginAllowed('https://evil-attacker.org')).toBe(false);
  });

  it('corsOriginDelegate executes callback with boolean approval or denial', () => {
    let allowedResult = null;
    corsOriginDelegate('https://codetogether.vercel.app', (err, allow) => {
      expect(err).toBeNull();
      allowedResult = allow;
    });
    expect(allowedResult).toBe(true);

    let rejectedResult = null;
    corsOriginDelegate('https://untrusted-domain.com', (err, allow) => {
      expect(err).toBeNull();
      rejectedResult = allow;
    });
    expect(rejectedResult).toBe(false);
  });
});

