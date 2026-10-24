import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import {
  encryptLicenseKey,
  decryptLicenseKey,
  getLicenseEncryptionKey,
} from '../../src/lib/license-crypto';

describe('Authenticated License Encryption at Rest (AES-256-GCM)', () => {
  const sampleKey = 'NAV-1A2B-3C4D-5E6F-7890';

  it('should encrypt and decrypt a license key cleanly with AES-256-GCM', () => {
    const encrypted = encryptLicenseKey(sampleKey);

    assert.ok(encrypted.encryptedKey, 'Ciphertext must be present');
    assert.ok(encrypted.keyIv, 'IV must be present');
    assert.ok(encrypted.keyTag, 'Auth tag must be present');
    assert.strictEqual(encrypted.keyVersion, 'v1');

    // Ciphertext must never equal plaintext
    assert.notStrictEqual(encrypted.encryptedKey, sampleKey);

    const decrypted = decryptLicenseKey({
      encryptedKey: encrypted.encryptedKey,
      keyIv: encrypted.keyIv,
      keyTag: encrypted.keyTag,
    });

    assert.strictEqual(decrypted, sampleKey);
  });

  it('should fail safely and return null if ciphertext is tampered (auth tag failure)', () => {
    const encrypted = encryptLicenseKey(sampleKey);

    const cipherBuf = Buffer.from(encrypted.encryptedKey, 'base64');
    cipherBuf[0] = cipherBuf[0] ^ 0xff; // Flip bits in ciphertext
    const tamperedCipher = cipherBuf.toString('base64');

    const decrypted = decryptLicenseKey({
      encryptedKey: tamperedCipher,
      keyIv: encrypted.keyIv,
      keyTag: encrypted.keyTag,
    });

    assert.strictEqual(decrypted, null, 'Must return null safely without throwing or fabricating keys');
  });

  it('should fail safely and return null if auth tag is tampered', () => {
    const encrypted = encryptLicenseKey(sampleKey);

    const tagBuf = Buffer.from(encrypted.keyTag, 'base64');
    tagBuf[0] = tagBuf[0] ^ 0xff;
    const tamperedTag = tagBuf.toString('base64');

    const decrypted = decryptLicenseKey({
      encryptedKey: encrypted.encryptedKey,
      keyIv: encrypted.keyIv,
      keyTag: tamperedTag,
    });

    assert.strictEqual(decrypted, null);
  });

  it('should fall back gracefully to legacy licenseKey when encrypted fields are absent', () => {
    const legacyRecord = {
      licenseKey: 'NAV-LEGA-CY99-KEY1-0000',
    };

    const decrypted = decryptLicenseKey(legacyRecord);
    assert.strictEqual(decrypted, legacyRecord.licenseKey);
  });

  it('should return null if record has neither encrypted fields nor legacy key', () => {
    const emptyRecord = {};
    const decrypted = decryptLicenseKey(emptyRecord);
    assert.strictEqual(decrypted, null);
  });

  it('should resolve a stable 32-byte key from environment or fallback', () => {
    const key = getLicenseEncryptionKey();
    assert.strictEqual(key.length, 32, 'Key must be exactly 32 bytes (256 bits)');
  });
});
