import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { prisma } from '../../src/lib/prisma';
import { markOrderPaid } from '../../src/lib/payment-completion';
import { decryptLicenseKey } from '../../src/lib/license-crypto';
import { OrderStatus, EmailOutboxStatus } from '@prisma/client';

describe('Payment Completion & License Issuance (Idempotency and Verification)', () => {
  let testProductId: string;

  before(async () => {
    const prod = await prisma.product.create({
      data: {
        code: `UNIT_TEST_PROD_${Date.now()}`,
        slug: `unit-test-prod-${Date.now()}`,
        name: 'Unit Test Script Driver',
        description: 'For payment completion verification',
        price: 39.0,
        priceMinor: 48000, // ₹480.00
        currency: 'INR',
        isActive: true,
      },
    });
    testProductId = prod.id;
  });

  after(async () => {
    if (testProductId) {
      await prisma.emailOutbox.deleteMany({
        where: { toEmail: { in: ['mismatch_user@example.com', 'currency_user@example.com', 'buyer_success@example.com', 'idemp_buyer@example.com'] } },
      });
      await prisma.license.deleteMany({ where: { productId: testProductId } });
      await prisma.payment.deleteMany({ where: { order: { productId: testProductId } } });
      await prisma.order.deleteMany({ where: { productId: testProductId } });
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
  });

  it('should reject payment with mismatched amount and advance order to PAYMENT_MISMATCH without issuing license', async () => {
    const orderToken = `ord_test_mismatch_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        publicToken: orderToken,
        productId: testProductId,
        customerEmail: 'mismatch_user@example.com',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.PAYMENT_PENDING,
      },
    });

    const result = await markOrderPaid({
      orderId: order.id,
      providerPaymentId: `pay_mismatch_${Date.now()}`,
      amountMinor: 39900, // Underpayment: ₹399 instead of ₹480
      currency: 'INR',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.orderStatus, OrderStatus.PAYMENT_MISMATCH);

    // Verify in database: Order status updated, 0 licenses issued
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { licenses: true },
    });
    assert.strictEqual(updatedOrder?.status, OrderStatus.PAYMENT_MISMATCH);
    assert.strictEqual(updatedOrder?.licenses.length, 0);
  });

  it('should reject payment with mismatched currency without issuing license', async () => {
    const orderToken = `ord_test_cur_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        publicToken: orderToken,
        productId: testProductId,
        customerEmail: 'currency_user@example.com',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.PAYMENT_PENDING,
      },
    });

    const result = await markOrderPaid({
      orderId: order.id,
      providerPaymentId: `pay_cur_${Date.now()}`,
      amountMinor: 48000,
      currency: 'USD', // Mismatched currency
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.orderStatus, OrderStatus.PAYMENT_MISMATCH);
  });

  it('should complete payment, issue formatted license key, and queue email in EmailOutbox', async () => {
    const orderToken = `ord_test_success_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        publicToken: orderToken,
        productId: testProductId,
        customerEmail: 'buyer_success@example.com',
        customerName: 'Aarav Sharma',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.PAYMENT_PENDING,
      },
    });

    const providerPaymentId = `pay_success_${Date.now()}`;
    const result = await markOrderPaid({
      orderId: order.id,
      providerPaymentId,
      amountMinor: 48000,
      currency: 'INR',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.isDuplicate, false);
    assert.strictEqual(result.orderStatus, OrderStatus.LICENSE_ISSUED);
    assert.ok(result.licenseId);

    // Verify License in database
    const license = await prisma.license.findUnique({
      where: { id: result.licenseId },
    });
    assert.ok(license);
    // Plaintext key MUST NOT be stored in DB per security requirements
    assert.strictEqual(license.licenseKey, null);
    assert.ok(license.encryptedKey);
    assert.ok(license.keyIv);
    assert.ok(license.keyTag);
    assert.strictEqual(license.maxActivations, 1);
    const decrypted = decryptLicenseKey(license);
    assert.match(decrypted || '', /^NAV-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
    assert.ok(license.keyLookupHash);
    assert.strictEqual(license.status, 'ACTIVE');

    // Verify Outbox item was queued
    const outboxItem = await prisma.emailOutbox.findFirst({
      where: { payloadRef: license.id },
    });
    assert.ok(outboxItem);
    assert.strictEqual(outboxItem.status, EmailOutboxStatus.PENDING);
    assert.strictEqual(outboxItem.toEmail, 'buyer_success@example.com');
  });

  it('should execute idempotently on repeat calls without creating duplicate licenses', async () => {
    const orderToken = `ord_test_idemp_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        publicToken: orderToken,
        productId: testProductId,
        customerEmail: 'idemp_buyer@example.com',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.PAYMENT_PENDING,
      },
    });

    const providerPaymentId = `pay_idemp_${Date.now()}`;

    // First completion
    const res1 = await markOrderPaid({
      orderId: order.id,
      providerPaymentId,
      amountMinor: 48000,
      currency: 'INR',
    });
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.isDuplicate, false);

    // Second completion (duplicate webhook delivery or repeat reconcile)
    const res2 = await markOrderPaid({
      orderId: order.id,
      providerPaymentId,
      amountMinor: 48000,
      currency: 'INR',
    });
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.isDuplicate, true);
    assert.strictEqual(res2.licenseId, res1.licenseId);

    // Total licenses for order must remain strictly 1
    const totalLicenses = await prisma.license.count({
      where: { orderId: order.id },
    });
    assert.strictEqual(totalLicenses, 1);
  });
});
