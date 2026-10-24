import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // NIST SP 800-38D recommended standard for GCM
const AUTH_TAG_LENGTH_BYTES = 16;
const KEY_VERSION = 'v1';

/**
 * Resolves the 256-bit (32-byte) AES key from server-side environment configuration.
 * Never exposes the key.
 */
export function getLicenseEncryptionKey(): Buffer {
  const envKey = process.env.LICENSE_ENCRYPTION_KEY?.trim();
  if (envKey) {
    if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
      return Buffer.from(envKey, 'hex');
    }
    if (envKey.length === 44 && envKey.endsWith('=')) {
      const buf = Buffer.from(envKey, 'base64');
      if (buf.length === 32) return buf;
    }
    return crypto.createHash('sha256').update(envKey).digest();
  }

  // Fallback in non-production/test environments derived from LICENSE_TOKEN_SECRET
  const tokenSecret = process.env.LICENSE_TOKEN_SECRET?.trim();
  if (tokenSecret) {
    return crypto.createHash('sha256').update(`nav-brahmi-enc:${tokenSecret}`).digest();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: LICENSE_ENCRYPTION_KEY environment variable is missing.');
  }

  return crypto.createHash('sha256').update('nav-brahmi-dev-test-encryption-key-32b').digest();
}

export interface EncryptedLicenseResult {
  encryptedKey: string; // base64 ciphertext
  keyIv: string;        // base64 12-byte IV
  keyTag: string;       // base64 16-byte GCM auth tag
  keyVersion: string;   // 'v1'
}

/**
 * Encrypts a license key at rest using authenticated AES-256-GCM.
 */
export function encryptLicenseKey(plaintext: string): EncryptedLicenseResult {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Cannot encrypt empty license key.');
  }

  const key = getLicenseEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedKey: ciphertext.toString('base64'),
    keyIv: iv.toString('base64'),
    keyTag: authTag.toString('base64'),
    keyVersion: KEY_VERSION,
  };
}

/**
 * Decrypts a license key record in memory.
 * Fails safely (returns null) on authentication failure or tampered ciphertext.
 * Never logs the decrypted key.
 */
export function decryptLicenseKey(record: {
  encryptedKey?: string | null;
  keyIv?: string | null;
  keyTag?: string | null;
  licenseKey?: string | null;
}): string | null {
  if (record.encryptedKey && record.keyIv && record.keyTag) {
    try {
      const key = getLicenseEncryptionKey();
      const iv = Buffer.from(record.keyIv, 'base64');
      const tag = Buffer.from(record.keyTag, 'base64');
      const ciphertext = Buffer.from(record.encryptedKey, 'base64');

      if (iv.length !== IV_LENGTH_BYTES || tag.length !== AUTH_TAG_LENGTH_BYTES) {
        return null;
      }

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH_BYTES,
      });
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf-8');
    } catch {
      // Return null on auth tag failure or corrupted ciphertext
      return null;
    }
  }

  // Graceful fallback for legacy records created prior to encryption implementation
  if (record.licenseKey) {
    return record.licenseKey;
  }

  return null;
}
