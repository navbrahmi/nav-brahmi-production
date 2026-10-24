import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/prisma';
import { GET as orderStatusHandler } from '../../src/app/api/orders/status/route';
import { OrderStatus } from '@prisma/client';

describe('Order Status Public API (/api/orders/status)', () => {
  let testProductId: string;
  let testOrderToken: string;

  before(async () => {
    const prod = await prisma.product.create({
      data: {
        code: `STATUS_PROD_${Date.now()}`,
        slug: `status-prod-${Date.now()}`,
        name: 'Status Test Driver',
        description: 'For status testing',
        price: 39.0,
        priceMinor: 48000,
        currency: 'INR',
        isActive: true,
      },
    });
    testProductId = prod.id;

    testOrderToken = `tok_status_test_${Date.now()}`;
    await prisma.order.create({
      data: {
        publicToken: testOrderToken,
        productId: prod.id,
        customerEmail: 'confidential_buyer@example.org',
        customerName: 'Sanjay Gupta',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.LICENSE_ISSUED,
        licenses: {
          create: {
            productId: prod.id,
            email: 'confidential_buyer@example.org',
            licenseKey: 'NAV-7777-8888-9999-0000',
            keyLookupHash: 'hash_for_status_test',
            status: 'ACTIVE',
          },
        },
      },
    });
  });

  after(async () => {
    if (testOrderToken) {
      const ord = await prisma.order.findUnique({ where: { publicToken: testOrderToken } });
      if (ord) {
        await prisma.license.deleteMany({ where: { orderId: ord.id } });
        await prisma.order.delete({ where: { id: ord.id } });
      }
    }
    if (testProductId) {
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
  });

  it('should return order status with masked email and never expose raw license key in public response', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/orders/status?token=${encodeURIComponent(testOrderToken)}`,
      {
        headers: { 'x-forwarded-for': '10.0.0.10' },
      }
    );

    const res = await orderStatusHandler(req);
    const body = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.order.publicToken, testOrderToken);
    assert.strictEqual(body.order.productName, 'Status Test Driver');
    assert.strictEqual(body.order.status, 'LICENSE_ISSUED');
    assert.strictEqual(body.order.hasLicense, true);

    // Email must be masked
    assert.strictEqual(body.order.customerEmail.includes('***'), true);
    assert.strictEqual(body.order.customerEmail.includes('confidential_buyer@'), false);

    // Raw license key MUST NOT appear anywhere in the public response JSON
    const serialized = JSON.stringify(body);
    assert.strictEqual(serialized.includes('NAV-7777-8888-9999-0000'), false);
  });

  it('should return 404 for unknown order token without leaking database internals', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/orders/status?token=unknown_random_token_nonexistent',
      {
        headers: { 'x-forwarded-for': '10.0.0.11' },
      }
    );

    const res = await orderStatusHandler(req);
    const body = await res.json();

    assert.strictEqual(res.status, 404);
    assert.strictEqual(body.error?.code, 'ORDER_NOT_FOUND');
  });

  it('should return 400 when token query parameter is omitted', async () => {
    const req = new NextRequest('http://localhost:3000/api/orders/status', {
      headers: { 'x-forwarded-for': '10.0.0.12' },
    });

    const res = await orderStatusHandler(req);
    assert.strictEqual(res.status, 400);
  });
});
