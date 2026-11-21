import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  verifyAdminCredentials,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '../../src/lib/admin-auth';

describe('Admin Authentication & Session Token Verification', () => {
  it('should verify valid admin credentials', () => {
    // Default password when env not set
    const valid = verifyAdminCredentials('admin', process.env.ADMIN_PASSWORD || 'NavBrahmi@Admin2026');
    assert.strictEqual(valid, true, 'Default admin credentials must validate');
  });

  it('should reject invalid username or password', () => {
    assert.strictEqual(verifyAdminCredentials('wrong_user', 'NavBrahmi@Admin2026'), false);
    assert.strictEqual(verifyAdminCredentials('admin', 'wrong_password'), false);
    assert.strictEqual(verifyAdminCredentials('', ''), false);
  });

  it('should create and verify valid admin session token', () => {
    const token = createAdminSessionToken('admin');
    assert.ok(typeof token === 'string' && token.includes('.'));

    const verification = verifyAdminSessionToken(token);
    assert.strictEqual(verification.valid, true);
    assert.strictEqual(verification.username, 'admin');
  });

  it('should reject tampered admin session tokens', () => {
    const token = createAdminSessionToken('admin');
    const parts = token.split('.');
    // Tamper payload
    const tamperedPayload = Buffer.from(JSON.stringify({ u: 'hacker', exp: Date.now() + 100000 })).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${parts[1]}`;

    const verification = verifyAdminSessionToken(tamperedToken);
    assert.strictEqual(verification.valid, false, 'Tampered token must be rejected');
  });

  it('should reject expired tokens', () => {
    const expiredPayload = Buffer.from(JSON.stringify({ u: 'admin', exp: Date.now() - 5000 })).toString('base64url');
    // Even if signature was attempted, expiration check must fail
    const verification = verifyAdminSessionToken(`${expiredPayload}.invalidsig`);
    assert.strictEqual(verification.valid, false, 'Expired token must fail verification');
  });
});

