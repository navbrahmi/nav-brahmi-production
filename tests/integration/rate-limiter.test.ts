import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { checkRateLimit } from '../../src/lib/rate-limiter';
import { prisma } from '../../src/lib/prisma';

describe('DB-Backed Fixed-Window Rate Limiter', () => {
  before(async () => {
    // Ensure scratch DB connection works
    await prisma.$queryRaw`SELECT 1`;
  });

  it('should allow requests within configured limit and block excess requests', async () => {
    const testKey = `test_action_${Date.now()}`;
    const testIp = '192.168.1.100';
    const limit = 3;

    // First 3 requests should pass
    const r1 = await checkRateLimit({ key: testKey, ip: testIp, limit, windowSeconds: 60 });
    assert.strictEqual(r1.success, true);
    assert.strictEqual(r1.remaining, 2);

    const r2 = await checkRateLimit({ key: testKey, ip: testIp, limit, windowSeconds: 60 });
    assert.strictEqual(r2.success, true);
    assert.strictEqual(r2.remaining, 1);

    const r3 = await checkRateLimit({ key: testKey, ip: testIp, limit, windowSeconds: 60 });
    assert.strictEqual(r3.success, true);
    assert.strictEqual(r3.remaining, 0);

    // 4th request must be blocked
    const r4 = await checkRateLimit({ key: testKey, ip: testIp, limit, windowSeconds: 60 });
    assert.strictEqual(r4.success, false);
    assert.strictEqual(r4.remaining, 0);

    // Different IP under same action key should have its own quota
    const rOtherIp = await checkRateLimit({ key: testKey, ip: '192.168.1.101', limit, windowSeconds: 60 });
    assert.strictEqual(rOtherIp.success, true);
    assert.strictEqual(rOtherIp.remaining, 2);
  });
});
