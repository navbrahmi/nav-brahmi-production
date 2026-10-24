import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../../src/lib/prisma';
import { reconcileOrders } from '../../src/lib/reconciliation';
import { decryptLicenseKey } from '../../src/lib/license-crypto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('Failure Recovery & Order Reconciliation (docs/production/06 §6)', () => {
  let testProductId: string;

  before(async () => {
    const prod = await prisma.product.create({
      data: {
        code: `RECON_PROD_${Date.now()}`,
        slug: `recon-prod-${Date.now()}`,
        name: 'Reconciliation Test Driver',
        description: 'For recovery verification',
        price: 39.0,
        priceMinor: 48000,
        currency: 'INR',
        isActive: true,
      },
    });
    testProductId = prod.id;
  });

  after(async () => {
    if (testProductId) {
      await prisma.emailOutbox.deleteMany({
        where: { toEmail: 'stuck_customer@example.com' },
      });
      await prisma.license.deleteMany({ where: { productId: testProductId } });
      const orders = await prisma.order.findMany({
        where: { productId: testProductId },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length > 0) {
        await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
        await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
  });

  it('should recover an order marked PAID that suffered license creation failure, issuing license once', async () => {
    const providerPaymentId = `pay_stuck_${Date.now()}`;
    const providerOrderId = `order_stuck_${Date.now()}`;

    // Simulate failure injection: Payment was captured, order marked PAID, but license creation was aborted/crashed
    const stuckOrder = await prisma.order.create({
      data: {
        publicToken: `ord_stuck_tok_${Date.now()}`,
        productId: testProductId,
        customerEmail: 'stuck_customer@example.com',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.PAID,
        payments: {
          create: {
            provider: 'RAZORPAY',
            providerOrderId,
            providerPaymentId,
            amountMinor: 48000,
            currency: 'INR',
            status: PaymentStatus.CAPTURED,
            verifiedAt: new Date(),
          },
        },
      },
    });

    // Verify initial simulated failure state: 0 licenses
    const initialLicenses = await prisma.license.count({
      where: { orderId: stuckOrder.id },
    });
    assert.strictEqual(initialLicenses, 0);

    // Run reconciliation job
    const reconResult = await reconcileOrders({ olderThanMinutes: 0 });
    assert.ok(reconResult.reconciled >= 1);

    // Verify recovery: Order has advanced to LICENSE_ISSUED and exactly 1 license exists
    const recoveredOrder = await prisma.order.findUnique({
      where: { id: stuckOrder.id },
      include: { licenses: true },
    });
    assert.strictEqual(recoveredOrder?.status, OrderStatus.LICENSE_ISSUED);
    const decrypted = decryptLicenseKey(recoveredOrder?.licenses[0] || {});
    assert.match(
      decrypted || '',
      /^NAV-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/
    );

    // Run reconciliation a second time to verify safety & idempotency
    const secondRecon = await reconcileOrders({ olderThanMinutes: 0 });
    const finalLicenses = await prisma.license.count({
      where: { orderId: stuckOrder.id },
    });
    assert.strictEqual(finalLicenses, 1, 'Reconciliation must never generate duplicate licenses');
  });
});
