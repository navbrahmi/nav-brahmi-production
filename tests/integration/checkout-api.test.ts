import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/prisma';
import { POST as checkoutHandler } from '../../src/app/api/checkout/route';

describe('Checkout API Endpoint (/api/checkout)', () => {
  let confirmedProductId: string;
  let unconfirmedPriceProductId: string;

  before(async () => {
    // Product with confirmed price
    const p1 = await prisma.product.create({
      data: {
        code: `CHK_CONFIRMED_${Date.now()}`,
        slug: `chk-confirmed-${Date.now()}`,
        name: 'Confirmed Script Driver',
        description: 'Ready for purchase',
        price: 39.0,
        priceMinor: 48000,
        currency: 'INR',
        isActive: true,
      },
    });
    confirmedProductId = p1.id;

    // Product with unconfirmed price (null priceMinor, C-02 pending)
    const p2 = await prisma.product.create({
      data: {
        code: `CHK_UNCONFIRMED_${Date.now()}`,
        slug: `chk-unconfirmed-${Date.now()}`,
        name: 'Unconfirmed Price Script',
        description: 'Awaiting client pricing approval',
        price: 39.0,
        priceMinor: null, // Unconfirmed
        currency: 'INR',
        isActive: true,
      },
    });
    unconfirmedPriceProductId = p2.id;
  });

  after(async () => {
    await prisma.order.deleteMany({
      where: { productId: { in: [confirmedProductId, unconfirmedPriceProductId] } },
    });
    await prisma.product.deleteMany({
      where: { id: { in: [confirmedProductId, unconfirmedPriceProductId] } },
    });
  });

  it('should reject checkout when product price is unconfirmed (C-02)', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.0.1',
      },
      body: JSON.stringify({
        productId: unconfirmedPriceProductId,
        customerName: 'Priya Patel',
        customerEmail: 'priya@example.com',
      }),
    });

    const res = await checkoutHandler(req);
    const body = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.error?.code, 'PRICE_PENDING_CONFIRMATION');
    assert.match(body.error?.message, /pending final client confirmation/);
  });

  it('should reject invalid or missing customer email format', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.0.2',
      },
      body: JSON.stringify({
        productId: confirmedProductId,
        customerEmail: 'invalid-email-format',
      }),
    });

    const res = await checkoutHandler(req);
    const body = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.error?.code, 'INVALID_EMAIL');
  });

  it('should create database order and return safe config-pending response when gateway credentials are not yet configured', async () => {
    // Ensure test environment does not have live credentials
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.0.3',
      },
      body: JSON.stringify({
        productId: confirmedProductId,
        customerName: 'Rohan Verma',
        customerEmail: 'rohan.verma@example.com',
      }),
    });

    const res = await checkoutHandler(req);
    const body = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.code, 'GATEWAY_CONFIG_PENDING');
    assert.ok(body.orderToken);

    // Verify order was created in database in CREATED status
    const dbOrder = await prisma.order.findUnique({
      where: { publicToken: body.orderToken },
    });
    assert.ok(dbOrder);
    assert.strictEqual(dbOrder.customerEmail, 'rohan.verma@example.com');
    assert.strictEqual(dbOrder.amountMinor, 48000);
    assert.strictEqual(dbOrder.status, 'CREATED');
  });
});
