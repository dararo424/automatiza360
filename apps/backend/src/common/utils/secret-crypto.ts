import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

/**
 * Cifrado simétrico para secretos de terceros almacenados en BD
 * (ej. tokens de acceso de Meta). AES-256-GCM con clave derivada de
 * TOKEN_ENCRYPTION_KEY. Formato: enc:v1:<iv>:<tag>:<data> (base64).
 *
 * Si TOKEN_ENCRYPTION_KEY no está configurada se almacena en claro y
 * se registra una advertencia (compatibilidad hacia atrás); los valores
 * legados en claro se leen sin cambios.
 */

const PREFIX = 'enc:v1:';
const logger = new Logger('SecretCrypto');
let warned = false;

function getKey(): Buffer | null {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    if (!warned) {
      logger.warn(
        'TOKEN_ENCRYPTION_KEY no configurada (mínimo 32 caracteres): los tokens de terceros se guardarán SIN cifrar',
      );
      warned = true;
    }
    return null;
  }
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored; // valor legado en claro

  const key = getKey();
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY requerida para descifrar un secreto almacenado cifrado');
  }

  const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
