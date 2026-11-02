import { z } from 'zod';

export const joinInputSchema = z.string().trim().min(1, 'Please enter a class link or code');

/**
 * Safely parses a full URL, relative path, or room slug with optional tokens.
 *
 * @param {string} rawInput
 * @returns {{ slug: string, inviteToken?: string, viewToken?: string } | null}
 */
export function parseClassLinkOrCode(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const input = rawInput.trim();
  if (!input) return null;

  try {
    let urlObj = null;

    if (input.startsWith('http://') || input.startsWith('https://')) {
      urlObj = new URL(input);
    } else if (input.startsWith('/')) {
      urlObj = new URL(`http://dummy.domain${input}`);
    } else if (input.includes('?')) {
      urlObj = new URL(`http://dummy.domain/room/${input}`);
    }

    if (urlObj) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      let slug = '';
      if (pathParts[0] === 'room' && pathParts[1]) {
        slug = pathParts[1];
      } else if (pathParts.length === 1) {
        slug = pathParts[0];
      }

      const inviteToken = urlObj.searchParams.get('invite') || undefined;
      const viewToken = urlObj.searchParams.get('view') || undefined;

      slug = slug ? slug.trim().toLowerCase() : '';
      if (!slug) return null;

      return {
        slug,
        inviteToken: inviteToken || undefined,
        viewToken: viewToken || undefined,
      };
    }

    // Bare slug or code
    let cleanSlug = input.replace(/^\/room\//, '').replace(/^\//, '').trim().toLowerCase();
    // Remove any trailing slashes
    cleanSlug = cleanSlug.replace(/\/+$/, '');

    if (!cleanSlug || cleanSlug.length > 100 || !/^[a-z0-9_-]+$/i.test(cleanSlug)) {
      return null;
    }

    return {
      slug: cleanSlug,
    };
  } catch (err) {
    return null;
  }
}
