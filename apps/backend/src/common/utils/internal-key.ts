import * as crypto from 'crypto';

/**
 * Compara la X-Internal-Key recibida contra INTERNAL_API_KEY en tiempo
 * constante. Falla cerrado: sin clave configurada o sin header → false.
 */
export function internalKeyMatches(provided: string | undefined): boolean {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
