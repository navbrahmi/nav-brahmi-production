import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import {
  generateSecureLicenseKey,
  createPurchaseAuthToken,
  verifyPurchaseAuthToken,
  createInstallerPayloadSignature,
  verifyInstallerPayloadSignature,
  getInstallerBackendUrl,
} from '../../src/lib/license';
import { getWindowsMachineId } from '../../src/lib/machine';

describe('License and Token Helpers', () => {
  const originalEnv = { ...process.env };

  before(() => {
    process.env.LICENSE_TOKEN_SECRET = 'test-token-secret-32-chars-long-value';
  });

  after(() => {
    process.env = originalEnv;
  });

  it('should generate properly formatted CSPRNG license keys', () => {
    const key = generateSecureLicenseKey();
    assert.match(key, /^NAV-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);

    // Verify uniqueness
    const key2 = generateSecureLicenseKey();
    assert.notStrictEqual(key, key2);
  });

  it('should create and verify short-lived purchase auth tokens', () => {
    const token = createPurchaseAuthToken('NAV-1111-2222-3333-4444', 'lic_123', 'customer@example.com');
    assert.ok(token.includes('.'));

    const verification = verifyPurchaseAuthToken(token);
    assert.strictEqual(verification.valid, true);
    assert.strictEqual(verification.payload?.license_key, 'NAV-1111-2222-3333-4444');
    assert.strictEqual(verification.payload?.email, 'customer@example.com');
  });

  it('should sign and verify installer payload signatures', () => {
    const backend = 'https://www.brahmicomputing.in';
    const key = 'NAV-1111-2222-3333-4444';
    const token = 'token_abc';
    const timestamp = 1729750000;

    const signature = createInstallerPayloadSignature(backend, key, token, timestamp);
    assert.strictEqual(typeof signature, 'string');
    assert.strictEqual(signature.length, 64); // hex sha256

    const isValid = verifyInstallerPayloadSignature(backend, key, token, timestamp, signature);
    assert.strictEqual(isValid, true);

    const isTampered = verifyInstallerPayloadSignature(backend, key, token, timestamp, signature.slice(0, -2) + '00');
    assert.strictEqual(isTampered, false);
  });

  it('should enforce https and reject localhost in production getInstallerBackendUrl', () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.APP_BASE_URL = 'https://www.brahmicomputing.in';

    const url = getInstallerBackendUrl();
    assert.strictEqual(url, 'https://www.brahmicomputing.in');

    // Reject insecure http in production
    process.env.APP_BASE_URL = 'http://www.brahmicomputing.in';
    assert.throws(() => {
      getInstallerBackendUrl();
    }, /must use https/);

    // Reject localhost in production
    process.env.APP_BASE_URL = 'https://localhost:3000';
    assert.throws(() => {
      getInstallerBackendUrl();
    }, /cannot point to localhost/);

    (process.env as any).NODE_ENV = 'development';
  });

  it('should isolate DEMO_MACHINE_ID simulation strictly to non-production', () => {
    (process.env as any).NODE_ENV = 'development';
    process.env.DEMO_MACHINE_ID = 'dev_simulated_guid';

    const devResult = getWindowsMachineId();
    assert.strictEqual(devResult.isSimulated, true);

    (process.env as any).NODE_ENV = 'production';
    const prodResult = getWindowsMachineId();
    assert.strictEqual(prodResult.isSimulated, false);

    (process.env as any).NODE_ENV = 'development';
  });
});
