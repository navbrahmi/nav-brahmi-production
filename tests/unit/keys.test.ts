import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { signActivationToken, verifyActivationToken, getSigningPrivateKey } from '../../src/lib/keys';

describe('Ed25519 Cryptographic Keys & Tokens', () => {
  let originalPrivateKey: string | undefined;
  let originalPublicKey: string | undefined;
  let testKeyPair: { publicKey: string; privateKey: string };

  before(() => {
    originalPrivateKey = process.env.LICENSE_SIGNING_PRIVATE_KEY;
    originalPublicKey = process.env.LICENSE_SIGNING_PUBLIC_KEY;

    // Generate fresh synthetic keypair for testing (not committed)
    testKeyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    process.env.LICENSE_SIGNING_PRIVATE_KEY = testKeyPair.privateKey;
    process.env.LICENSE_SIGNING_PUBLIC_KEY = testKeyPair.publicKey;
  });

  after(() => {
    process.env.LICENSE_SIGNING_PRIVATE_KEY = originalPrivateKey;
    process.env.LICENSE_SIGNING_PUBLIC_KEY = originalPublicKey;
  });

  it('should sign and verify valid activation token', () => {
    const payload = {
      license_id: 'lic_test_123',
      license_key: 'NAV-1111-2222-3333-4444',
      product_code: 'TAMIL-GRANTHA',
      machine_id: 'test_machine_hash_001',
      status: 'ACTIVE',
      issued_at: Math.floor(Date.now() / 1000),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = signActivationToken(payload);
    assert.strictEqual(typeof token, 'string');
    assert.ok(token.includes('.'));

    const verification = verifyActivationToken(token, 'test_machine_hash_001');
    assert.strictEqual(verification.valid, true);
    assert.strictEqual(verification.payload?.license_key, 'NAV-1111-2222-3333-4444');
    assert.strictEqual(verification.payload?.machine_id, 'test_machine_hash_001');
  });

  it('should reject tampered token signatures', () => {
    const payload = {
      license_id: 'lic_test_tamper',
      license_key: 'NAV-AAAA-BBBB-CCCC-DDDD',
      product_code: 'KANNADA',
      machine_id: 'machine_abc',
      status: 'ACTIVE',
      issued_at: Math.floor(Date.now() / 1000),
    };

    const token = signActivationToken(payload);
    const [body, sig] = token.split('.');
    const tamperedToken = `${body}.${sig.slice(0, -4)}AAAA`;

    const verification = verifyActivationToken(tamperedToken);
    assert.strictEqual(verification.valid, false);
    assert.ok(verification.error?.includes('signature verification failed'));
  });

  it('should reject machine ID mismatch', () => {
    const payload = {
      license_id: 'lic_test_bound',
      license_key: 'NAV-9999-8888-7777-6666',
      product_code: 'MALAYALAM',
      machine_id: 'machine_bound_original',
      status: 'ACTIVE',
      issued_at: Math.floor(Date.now() / 1000),
    };

    const token = signActivationToken(payload);
    const verification = verifyActivationToken(token, 'different_machine_attacker');
    assert.strictEqual(verification.valid, false);
    assert.ok(verification.error?.includes('Machine ID mismatch'));
  });

  it('should throw immediately when signing private key is missing', () => {
    delete process.env.LICENSE_SIGNING_PRIVATE_KEY;
    assert.throws(() => {
      getSigningPrivateKey();
    }, /FATAL: LICENSE_SIGNING_PRIVATE_KEY environment variable is missing/);
    process.env.LICENSE_SIGNING_PRIVATE_KEY = testKeyPair.privateKey;
  });
});
