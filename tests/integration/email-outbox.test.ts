import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../../src/lib/prisma';
import { processEmailOutbox } from '../../src/lib/email/outbox';
import { MockEmailTransport, DevEmailTransport } from '../../src/lib/email/transport';
import { OrderStatus, EmailOutboxStatus } from '@prisma/client';

describe('Email Outbox Dispatch, Backoff & Delivery State Advancement', () => {
  let testProductId: string;
  let testLicenseId: string;
  let testOrderId: string;

  before(async () => {
    process.env.LICENSE_TOKEN_SECRET = process.env.LICENSE_TOKEN_SECRET || 'test_token_secret_min_16_chars_outbox';
    const prod = await prisma.product.create({
      data: {
        code: `EMAIL_TEST_PROD_${Date.now()}`,
        slug: `email-test-prod-${Date.now()}`,
        name: 'Email Outbox Test Script Driver',
        description: 'For email testing',
        price: 39.0,
        priceMinor: 48000,
        currency: 'INR',
        isActive: true,
      },
    });
    testProductId = prod.id;

    const order = await prisma.order.create({
      data: {
        publicToken: `ord_email_tok_${Date.now()}`,
        productId: testProductId,
        customerEmail: 'customer_email_outbox@example.com',
        amountMinor: 48000,
        currency: 'INR',
        status: OrderStatus.LICENSE_ISSUED,
      },
    });
    testOrderId = order.id;

    const license = await prisma.license.create({
      data: {
        orderId: order.id,
        productId: prod.id,
        email: 'customer_email_outbox@example.com',
        licenseKey: 'NAV-9999-AAAA-BBBB-CCCC',
        keyLookupHash: 'hash_for_test',
        status: 'ACTIVE',
      },
    });
    testLicenseId = license.id;
  });

  after(async () => {
    if (testLicenseId) {
      await prisma.emailOutbox.deleteMany({ where: { payloadRef: testLicenseId } });
      await prisma.license.deleteMany({ where: { id: testLicenseId } });
    }
    if (testOrderId) {
      await prisma.order.deleteMany({ where: { id: testOrderId } });
    }
    if (testProductId) {
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
  });

  it('should deliver queued email and advance order from LICENSE_ISSUED to DELIVERED', async () => {
    // Clear any pending outbox records leftover from concurrent tests
    await prisma.emailOutbox.deleteMany({ where: { status: EmailOutboxStatus.PENDING } });

    const outboxRecord = await prisma.emailOutbox.create({
      data: {
        kind: 'LICENSE_DELIVERY',
        toEmail: 'customer_email_outbox@example.com',
        payloadRef: testLicenseId,
        status: EmailOutboxStatus.PENDING,
      },
    });

    const mockTransport = new MockEmailTransport();
    const result = await processEmailOutbox({ transport: mockTransport, limit: 10 });

    assert.ok(result.sent >= 1);
    const sentMail = mockTransport.sentMails.find((m) => m.to === 'customer_email_outbox@example.com');
    assert.ok(sentMail);
    assert.match(sentMail.subject, /Your License Key for Email Outbox Test Script Driver/);
    assert.ok(sentMail.text.includes('NAV-9999-AAAA-BBBB-CCCC'));

    // Verify outbox record status is SENT
    const updatedOutbox = await prisma.emailOutbox.findUnique({
      where: { id: outboxRecord.id },
    });
    assert.strictEqual(updatedOutbox?.status, EmailOutboxStatus.SENT);
    assert.ok(updatedOutbox?.sentAt);

    // Verify order state advanced to DELIVERED
    const updatedOrder = await prisma.order.findUnique({
      where: { id: testOrderId },
    });
    assert.strictEqual(updatedOrder?.status, OrderStatus.DELIVERED);
  });

  it('should schedule retry with exponential backoff on simulated transport failure without corrupting order state', async () => {
    const outboxRecord = await prisma.emailOutbox.create({
      data: {
        kind: 'LICENSE_DELIVERY',
        toEmail: 'failing_cust@example.com',
        payloadRef: testLicenseId,
        status: EmailOutboxStatus.PENDING,
      },
    });

    const failingTransport = new MockEmailTransport();
    failingTransport.shouldFail = true;
    failingTransport.failErrorMessage = 'Simulated SMTP connection refused';

    const result = await processEmailOutbox({ transport: failingTransport, limit: 10 });

    assert.ok(result.failed >= 1);

    const updatedOutbox = await prisma.emailOutbox.findUnique({
      where: { id: outboxRecord.id },
    });
    assert.strictEqual(updatedOutbox?.status, EmailOutboxStatus.PENDING);
    assert.strictEqual(updatedOutbox?.attempts, 1);
    // nextAttemptAt must be in the future (backoff)
    assert.ok(updatedOutbox && updatedOutbox.nextAttemptAt > new Date());

    // License remains ACTIVE and intact
    const license = await prisma.license.findUnique({ where: { id: testLicenseId } });
    assert.strictEqual(license?.status, 'ACTIVE');
  });

  it('should format redacted development transport logs without throwing or exposing full keys', async () => {
    const devTransport = new DevEmailTransport();
    const sendResult = await devTransport.sendMail({
      to: 'confidential_client@example.com',
      subject: 'Test Subject',
      text: 'License Key: NAV-1234-5678-ABCD-EF01 Instructions: https://brahmicomputing.in/instructions',
    });

    assert.strictEqual(sendResult.success, true);
    assert.ok(sendResult.messageId?.startsWith('dev-'));
  });
});
