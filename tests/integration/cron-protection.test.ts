import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as emailCronHandler } from '../../src/app/api/cron/email-outbox/route';
import { POST as reconcileCronHandler } from '../../src/app/api/cron/reconcile/route';

describe('Protected Cron Endpoints Authorization (CRON_SECRET)', () => {
  const testCronSecret = 'test_cron_secret_auth_token_98765';

  before(() => {
    process.env.CRON_SECRET = testCronSecret;
  });

  after(() => {
    delete process.env.CRON_SECRET;
  });

  it('should reject unauthenticated requests to email outbox cron with status 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/email-outbox', {
      method: 'POST',
    });

    const res = await emailCronHandler(req);
    assert.strictEqual(res.status, 401);
  });

  it('should allow authorized requests to email outbox cron with valid Bearer token', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/email-outbox', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testCronSecret}`,
      },
    });

    const res = await emailCronHandler(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });

  it('should reject unauthenticated requests to reconciliation cron with status 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/reconcile', {
      method: 'POST',
    });

    const res = await reconcileCronHandler(req);
    assert.strictEqual(res.status, 401);
  });

  it('should allow authorized requests to reconciliation cron with valid Bearer token', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/reconcile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testCronSecret}`,
      },
    });

    const res = await reconcileCronHandler(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });
});
