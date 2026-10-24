import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/prisma';
import { POST as webhookHandler } from '../../src/app/api/payments/webhook/route';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('Concurrency & Race-Condition Defense (10 Parallel Webhook Deliveries)', () => {
  const webhookSecret = 'whsec_concurrency_test_secret_12345';
  let testProductId: string;

  before(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

    const prod = await prisma.product.create({
      data: {
        code: `CONCUR_PROD_${Date.now()}`,
        slug: `concur-prod-${Date.now()}`,
        name: 'Concurrency Test Script Driver',
        description: 'For parallel stress testing',
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
        where: { toEmail: 'concurrency_customer@example.com' },
      });
      await prisma.license.deleteMany({ where: { productId: testProductId } });
      await prisma.payment.deleteMany({ where: { order: { productId: testProductId } } });
      await prisma.webhookEvent.deleteMany({ where: { order: { productId: testProductId } } });
      await prisma.order.deleteMany({ where: { productId: testProductId } });
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
  });

  it('should process 10 parallel webhook requests and guarantee exactly 1 license is created and 1 payment recorded', async () => {
    const providerOrderId = `order_concur_${Date.now()}`;
    const providerPaymentId = `pay_concur_${Date.now()}`;

    const order = await prisma.order.create({
      data: {
        publicToken: `ord_concur_tok_${Date.now()}`,
        productId: testProductId,
        customerEmail: 'concurrency_customer@example.com',
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

    // Launch 10 simultaneous requests
    const promises = Array.from({ length: 10 }).map((_, index) => {
      const req = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
          'x-razorpay-event-id': `evt_concur_${providerOrderId}_delivery_${index}`,
        },
        body: rawBody,
      });
      return webhookHandler(req);
    });

    const responses = await Promise.all(promises);

    // Verify all 10 responses succeeded (status 200)
    for (const res of responses) {
      assert.strictEqual(res.status, 200);
    }

    // Verify database state: EXACTLY ONE LICENSE ISSUED
    const licenses = await prisma.license.findMany({
      where: { orderId: order.id },
    });
    assert.strictEqual(
      licenses.length,
      1,
      `Expected exactly 1 license to be issued, but found ${licenses.length}`
    );

    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    assert.ok(
      finalOrder?.status === OrderStatus.LICENSE_ISSUED || finalOrder?.status === OrderStatus.DELIVERED,
      `Expected status LICENSE_ISSUED or DELIVERED, got ${finalOrder?.status}`
    );
  });
});
