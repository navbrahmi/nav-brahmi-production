import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/prisma';
import { POST as webhookHandler } from '../../src/app/api/payments/webhook/route';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('Razorpay Webhook Handler API (/api/payments/webhook)', () => {
  const webhookSecret = 'whsec_test_suite_secret_987654';
  let testProductId: string;

  before(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

    const prod = await prisma.product.create({
      data: {
        code: `WH_TEST_PROD_${Date.now()}`,
        slug: `wh-test-prod-${Date.now()}`,
        name: 'Webhook Test Script Driver',
        description: 'For webhook integration testing',
        price: 39.0,
        priceMinor: 48000,
        currency: 'INR',
        isActive: true,
      },
    });
    testProductId = prod.id;
  });

  after(async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    if (testProductId) {
      await prisma.emailOutbox.deleteMany({
        where: { toEmail: { in: ['wh_customer@example.com', 'dup_customer@example.com', 'failed_pay@example.com', 'refund_cust@example.com'] } },
      });
      await prisma.license.deleteMany({ where: { productId: testProductId } });
      await prisma.payment.deleteMany({ where: { order: { productId: testProductId } } });
      await prisma.webhookEvent.deleteMany({ where: { order: { productId: testProductId } } });
      await prisma.order.deleteMany({ where: { productId: testProductId } });
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
  });

  it('should process valid payment.captured webhook, issue license, and record WebhookEvent', async () => {
    const providerOrderId = `order_wh_${Date.now()}`;
    const providerPaymentId = `pay_wh_${Date.now()}`;
    const eventId = `evt_wh_${Date.now()}`;

    // Seed order in PAYMENT_PENDING with providerOrderId
    const order = await prisma.order.create({
      data: {
        publicToken: `ord_wh_tok_${Date.now()}`,
        productId: testProductId,
        customerEmail: 'wh_customer@example.com',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.PAYMENT_PENDING,
        payments: {
          create: {
            provider: 'RAZORPAY',
            providerOrderId,
            amountMinor: 48000,
            currency: 'INR',
            status: PaymentStatus.CREATED,
          },
        },
      },
    });

    const payload = {
      entity: 'event',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: providerPaymentId,
            order_id: providerOrderId,
            amount: 48000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const req = new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': eventId,
      },
      body: rawBody,
    });

    const res = await webhookHandler(req);
    const resBody = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(resBody.received, true);
    assert.strictEqual(resBody.orderStatus, OrderStatus.LICENSE_ISSUED);

    // Verify order was advanced to LICENSE_ISSUED and license created
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { licenses: true },
    });
    assert.strictEqual(updatedOrder?.status, OrderStatus.LICENSE_ISSUED);
    assert.strictEqual(updatedOrder?.licenses.length, 1);

    // Verify WebhookEvent record
    const recordedEvent = await prisma.webhookEvent.findUnique({
      where: { providerEventId: eventId },
    });
    assert.ok(recordedEvent);
    assert.strictEqual(recordedEvent.type, 'payment.captured');
    assert.ok(recordedEvent.processedAt);
  });

  it('should reject webhook with invalid signature with status 400', async () => {
    const rawBody = JSON.stringify({ entity: 'event', event: 'payment.captured' });
    const req = new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_forged_hex_signature_9999',
        'x-razorpay-event-id': `evt_bad_sig_${Date.now()}`,
      },
      body: rawBody,
    });

    const res = await webhookHandler(req);
    const resBody = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(resBody.error, 'Invalid webhook signature');
  });

  it('should handle duplicate webhook delivery idempotently returning 200 OK without re-issuing license', async () => {
    const providerOrderId = `order_dup_${Date.now()}`;
    const providerPaymentId = `pay_dup_${Date.now()}`;
    const duplicateEventId = `evt_dup_${Date.now()}`;

    const order = await prisma.order.create({
      data: {
        publicToken: `ord_dup_tok_${Date.now()}`,
        productId: testProductId,
        customerEmail: 'dup_customer@example.com',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.PAYMENT_PENDING,
        payments: {
          create: {
            provider: 'RAZORPAY',
            providerOrderId,
            amountMinor: 48000,
            currency: 'INR',
            status: PaymentStatus.CREATED,
          },
        },
      },
    });

    const rawBody = JSON.stringify({
      entity: 'event',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: providerPaymentId,
            order_id: providerOrderId,
            amount: 48000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    });

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // First Delivery
    const req1 = new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': duplicateEventId,
      },
      body: rawBody,
    });
    const res1 = await webhookHandler(req1);
    assert.strictEqual(res1.status, 200);

    // Second Delivery with same x-razorpay-event-id
    const req2 = new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': duplicateEventId,
      },
      body: rawBody,
    });
    const res2 = await webhookHandler(req2);
    const body2 = await res2.json();

    assert.strictEqual(res2.status, 200);
    assert.strictEqual(body2.duplicate, true);

    // Verify only 1 license exists
    const licenseCount = await prisma.license.count({
      where: { orderId: order.id },
    });
    assert.strictEqual(licenseCount, 1);
  });

  it('should mark order FAILED when payment.failed webhook event arrives', async () => {
    const providerOrderId = `order_failed_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        publicToken: `ord_fail_tok_${Date.now()}`,
        productId: testProductId,
        customerEmail: 'failed_pay@example.com',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.PAYMENT_PENDING,
        payments: {
          create: {
            provider: 'RAZORPAY',
            providerOrderId,
            amountMinor: 48000,
            currency: 'INR',
            status: PaymentStatus.CREATED,
          },
        },
      },
    });

    const rawBody = JSON.stringify({
      entity: 'event',
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_fail_${Date.now()}`,
            order_id: providerOrderId,
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Card was declined',
          },
        },
      },
    });

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const req = new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': `evt_fail_${Date.now()}`,
      },
      body: rawBody,
    });

    const res = await webhookHandler(req);
    assert.strictEqual(res.status, 200);

    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    assert.strictEqual(updated?.status, OrderStatus.FAILED);
  });

  it('should mark order NEEDS_ATTENTION upon refund event without automatically revoking license (C-08 pending)', async () => {
    const providerOrderId = `order_rfnd_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        publicToken: `ord_rfnd_tok_${Date.now()}`,
        productId: testProductId,
        customerEmail: 'refund_cust@example.com',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.LICENSE_ISSUED,
        payments: {
          create: {
            provider: 'RAZORPAY',
            providerOrderId,
            amountMinor: 48000,
            currency: 'INR',
            status: PaymentStatus.CAPTURED,
          },
        },
      },
    });

    const rawBody = JSON.stringify({
      entity: 'event',
      event: 'refund.processed',
      payload: {
        payment: {
          entity: {
            id: `pay_rfnd_${Date.now()}`,
            order_id: providerOrderId,
          },
        },
      },
    });

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const req = new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': `evt_rfnd_${Date.now()}`,
      },
      body: rawBody,
    });

    const res = await webhookHandler(req);
    assert.strictEqual(res.status, 200);

    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    assert.strictEqual(updated?.status, OrderStatus.NEEDS_ATTENTION);
  });
});
