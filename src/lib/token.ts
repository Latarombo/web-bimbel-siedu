import crypto from 'node:crypto';

/**
 * Menghasilkan token acak yang aman secara kriptografis (64 karakter heksadesimal).
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Menghasilkan hash SHA-256 dari token mentah.
 * Hash ini yang disimpan di database untuk mencegah kebocoran token jika database terekspos.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}
