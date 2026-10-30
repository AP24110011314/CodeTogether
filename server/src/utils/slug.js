import { customAlphabet } from 'nanoid';
import crypto from 'crypto';

// URL-safe lowercase alphabet without ambiguous characters
const nanoidSlug = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

export function generateSlug() {
  return nanoidSlug();
}

export function generateToken(length = 24) {
  return crypto.randomBytes(length).toString('hex');
}

