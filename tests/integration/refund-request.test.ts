import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../../src/lib/prisma';
import { submitRefundRequest, RefundRequestError } from '../../src/lib/refund-request';
import crypto from 'crypto';

describe('Refund Request Intake & Manual Review Workflow (C-08 & C-18)', () => {
  let testProductId: string;
  let recentOrderToken: string;
  let recentOrderId: string;
  let recentLicenseId: string;

  let expiredOrderToken: string;
  let expiredOrderId: string;
  let expiredLicenseId: string;

  let uninstalledOrderToken: string;
  let uninstalledOrderId: string;

  before(async () => {
    // 1. Ensure test product exists
    const prod = await prisma.product.upsert({
      where: { code: 'KANNADA' },
      update: {},
      create: {
        code: 'KANNADA',
        slug: 'kannada',
        name: 'Kannada',
        description: 'Kannada keyboard layout driver',
        priceMinor: 47200,
        price: 472.0,
        currency: 'INR',
        isActive: true,
      },
    });
    testProductId = prod.id;

    // 2. Order A: Installed 2 days ago (within 7-day window)
    recentOrderToken = `tok_recent_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const orderA = await prisma.order.create({
      data: {
        productId: testProductId,
        customerEmail: 'customer-recent@example.com',
        customerName: 'Recent Customer',
        amountMinor: 47200,
        currency: 'INR',
        status: 'PAID',
        publicToken: recentOrderToken,
      },
    });
    recentOrderId = orderA.id;

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const licA = await prisma.license.create({
      data: {
        orderId: recentOrderId,
        productId: testProductId,
        licenseKey: `NAV-REC-${Date.now()}`,
        email: 'customer-recent@example.com',
        status: 'ACTIVE',
        installedAt: twoDaysAgo,
      },
    });
    recentLicenseId = licA.id;

    // 3. Order B: Installed 10 days ago (outside 7-day window)
    expiredOrderToken = `tok_expired_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const orderB = await prisma.order.create({
      data: {
        productId: testProductId,
        customerEmail: 'customer-expired@example.com',
        customerName: 'Expired Customer',
        amountMinor: 47200,
        currency: 'INR',
        status: 'PAID',
        publicToken: expiredOrderToken,
      },
    });
    expiredOrderId = orderB.id;

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const licB = await prisma.license.create({
      data: {
        orderId: expiredOrderId,
        productId: testProductId,
        licenseKey: `NAV-EXP-${Date.now()}`,
        email: 'customer-expired@example.com',
        status: 'ACTIVE',
        installedAt: tenDaysAgo,
      },
    });
    expiredLicenseId = licB.id;

    // 4. Order C: Paid, but no installation timestamp recorded
    uninstalledOrderToken = `tok_uninst_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const orderC = await prisma.order.create({
      data: {
        productId: testProductId,
        customerEmail: 'customer-uninst@example.com',
        customerName: 'Uninstalled Customer',
        amountMinor: 47200,
        currency: 'INR',
        status: 'PAID',
        publicToken: uninstalledOrderToken,
      },
    });
    uninstalledOrderId = orderC.id;

    await prisma.license.create({
      data: {
        orderId: uninstalledOrderId,
        productId: testProductId,
        licenseKey: `NAV-NOINST-${Date.now()}`,
        email: 'customer-uninst@example.com',
        status: 'ACTIVE',
        installedAt: null,
      },
    });
    // Clean up any stale rate limit buckets from previous test runs
    await prisma.rateLimitBucket.deleteMany({
      where: { key: { startsWith: 'refund_request' } },
    });
  });

  after(async () => {
    try {
      await prisma.rateLimitBucket.deleteMany({
        where: { key: { startsWith: 'refund_request' } },
      });
      const orderIds = [recentOrderId, expiredOrderId, uninstalledOrderId].filter(Boolean);
      for (const oId of orderIds) {
        await prisma.refundRequest.deleteMany({ where: { orderId: oId } });
        await prisma.license.deleteMany({ where: { orderId: oId } });
        await prisma.order.deleteMany({ where: { id: oId } });
      }
    } catch {}
  });

  it('should accept refund request within 7 calendar days of installation and store as PENDING_REVIEW', async () => {
    const result = await submitRefundRequest({
      orderToken: recentOrderToken,
      reason: 'The layout crashes Microsoft Word when typing complex conjuncts with virama.',
      supportingInfo: 'Windows 11 build 22631, Word version 16.0.17328, happens consistently on third keypress.',
      ip: '192.168.1.10',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'PENDING_REVIEW');
    assert.ok(result.requestId);
    assert.ok(result.installationTimestamp);

    // Verify stored in database
    const saved = await prisma.refundRequest.findUnique({
      where: { id: result.requestId },
    });
    assert.ok(saved);
    assert.strictEqual(saved?.status, 'PENDING_REVIEW');
    assert.strictEqual(saved?.reason, 'The layout crashes Microsoft Word when typing complex conjuncts with virama.');
  });

  it('should reject refund request submitted outside the 7-day calendar window (C-08)', async () => {
    await assert.rejects(
      async () => {
        await submitRefundRequest({
          orderToken: expiredOrderToken,
          reason: 'I want a refund because I changed my mind about using this script.',
          ip: '192.168.1.20',
        });
      },
      (err: any) => {
        assert.ok(err instanceof RefundRequestError);
        assert.strictEqual(err.code, 'REFUND_WINDOW_EXPIRED');
        assert.ok(err.message.includes('7 calendar days'));
        return true;
      }
    );
  });

  it('should route request for manual support review when installation timestamp is unavailable (C-08/C-18 fallback)', async () => {
    const result = await submitRefundRequest({
      orderToken: uninstalledOrderToken,
      reason: 'Setup bootstrapper failed to launch on my Windows 11 system with error 1603.',
      ip: '192.168.1.30',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'PENDING_REVIEW');
    assert.strictEqual(result.installationTimestamp, null, 'Installation timestamp should be null');

    const saved = await prisma.refundRequest.findUnique({
      where: { id: result.requestId },
    });
    assert.ok(saved);
    assert.strictEqual(saved?.status, 'PENDING_REVIEW');
    assert.strictEqual(saved?.installationAt, null);
  });

  it('should reject duplicate pending refund requests on the same order', async () => {
    await assert.rejects(
      async () => {
        await submitRefundRequest({
          orderToken: recentOrderToken,
          reason: 'Submitting a duplicate request to see if it speeds up review.',
          ip: '192.168.1.10',
        });
      },
      (err: any) => {
        assert.ok(err instanceof RefundRequestError);
        assert.strictEqual(err.code, 'DUPLICATE_REQUEST_PENDING');
        return true;
      }
    );
  });

  it('should reject requests with insufficient or vague issue description', async () => {
    await assert.rejects(
      async () => {
        await submitRefundRequest({
          orderToken: recentOrderToken,
          reason: 'broken', // Less than 15 chars
          ip: '192.168.1.40',
        });
      },
      (err: any) => {
        assert.ok(err instanceof RefundRequestError);
        assert.strictEqual(err.code, 'INSUFFICIENT_REASON');
        return true;
      }
    );
  });

  it('should verify that submitting a refund request NEVER automatically revokes license or refunds payment', async () => {
    const lic = await prisma.license.findUnique({
      where: { id: recentLicenseId },
    });
    assert.strictEqual(lic?.status, 'ACTIVE', 'License status must remain ACTIVE upon refund request submission');

    const order = await prisma.order.findUnique({
      where: { id: recentOrderId },
    });
    assert.notStrictEqual(order?.status, 'REFUNDED', 'Order status must not be automatically set to REFUNDED');
    assert.strictEqual(order?.status, 'PAID', 'Order status must remain in its current state');
  });
});
