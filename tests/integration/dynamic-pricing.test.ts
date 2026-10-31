try {
  process.loadEnvFile?.('.env');
} catch {}

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../../src/lib/prisma';
import { GET as getProducts } from '../../src/app/api/products/route';
import { POST as postCheckout } from '../../src/app/api/checkout/route';
import { NextRequest } from 'next/server';

describe('Dynamic Product Pricing Architecture (Database-Driven Verification)', () => {
  const dynamicTestSlug = `test-dynamic-pricing-${Date.now()}`;
  const dynamicTestCode = `DYNAMIC_TEST_${Date.now()}`;
  let testProductId: string;

  before(async () => {
    // Create a dynamic test product in the database with custom price ₹550.00 (55000 paise)
    const product = await prisma.product.create({
      data: {
        name: 'Dynamic Pricing Test Script',
        slug: dynamicTestSlug,
        code: dynamicTestCode,
        description: 'Verifying that prices are 100% dynamic and pulled from DB',
        price: 550.0,
        priceMinor: 55000,
        currency: 'INR',
        isActive: true,
      },
    });
    testProductId = product.id;
  });

  after(async () => {
    // Cleanup test product and any created orders
    await prisma.order.deleteMany({ where: { productId: testProductId } });
    await prisma.product.deleteMany({ where: { id: testProductId } });
  });

  it('should dynamically pull product price from the database via GET /api/products', async () => {
    const res = await getProducts();
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.products));

    const found = data.products.find((p: any) => p.id === testProductId);
    assert.ok(found, 'Test product must be present in dynamic API response');
    assert.strictEqual(found.priceMinor, 55000, 'Price minor must match DB row (55000)');
    assert.strictEqual(found.formattedPrice, '₹550.00', 'Formatted price must reflect DB');
    assert.strictEqual(found.currency, 'INR');
    assert.strictEqual(found.isCheckoutAllowed, true);
  });

  it('should dynamically charge the database price during checkout, ignoring client-submitted amounts', async () => {
    // Attempt checkout sending an arbitrary/malicious client amount (e.g. ₹10.00 = 1000 paise)
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({
        productId: testProductId,
        customerName: 'Dynamic Pricing Tester',
        customerEmail: 'dynamic-test@example.com',
        amount: 1000, // Should be completely ignored by checkout
        price: 10,    // Should be completely ignored by checkout
      }),
    });

    const res = await postCheckout(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(data.orderToken);

    // Verify the created Order in the database was charged the exact DB product priceMinor (55000), NOT the client amount (1000)
    const dbOrder = await prisma.order.findUnique({
      where: { publicToken: data.orderToken },
    });

    assert.ok(dbOrder, 'Order must exist in database');
    assert.strictEqual(dbOrder.amountMinor, 55000, 'Order amountMinor must be exactly 55000 paise from DB');
    assert.strictEqual(dbOrder.currency, 'INR');
  });

  it('should immediately reflect real-time database price updates during checkout without rebuild or restart', async () => {
    // Dynamically update the product price in the database to ₹625.00 (62500 paise)
    await prisma.product.update({
      where: { id: testProductId },
      data: {
        price: 625.0,
        priceMinor: 62500,
      },
    });

    // Execute checkout again
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({
        productId: testProductId,
        customerName: 'Dynamic Pricing Tester 2',
        customerEmail: 'dynamic-test-2@example.com',
      }),
    });

    const res = await postCheckout(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);

    const dbOrder = await prisma.order.findUnique({
      where: { publicToken: data.orderToken },
    });

    assert.ok(dbOrder);
    assert.strictEqual(
      dbOrder.amountMinor,
      62500,
      'Order amountMinor must dynamically reflect the updated DB price of 62500 paise'
    );
  });

  it('should reject checkout when database price is null or unconfirmed', async () => {
    // Set priceMinor to null in the database
    await prisma.product.update({
      where: { id: testProductId },
      data: {
        priceMinor: null,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({
        productId: testProductId,
        customerName: 'Dynamic Pricing Tester 3',
        customerEmail: 'dynamic-test-3@example.com',
      }),
    });

    const res = await postCheckout(req);
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.error.code, 'PRICE_PENDING_CONFIRMATION');
  });
});
