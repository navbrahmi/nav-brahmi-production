import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/prisma';
import { POST as recoverRequestHandler } from '../../src/app/api/license/recover/route';
import { GET as redeemHandler } from '../../src/app/api/recovery/redeem/route';
import { setEmailTransport, MockEmailTransport } from '../../src/lib/email/transport';

describe('License Recovery Workflow (/api/license/recover & /api/recovery/redeem)', () => {
  let mockTransport: MockEmailTransport;
  let testProduct: any;
  let testLicense: any;
  let testActivation: any;
  const testEmail = 'recovery.customer@example.com';
  const unknownEmail = 'nobody.purchased.here@example.com';
  const machineHash = 'machine_hash_preserved_001';

  before(async () => {
    process.env.LICENSE_TOKEN_SECRET = process.env.LICENSE_TOKEN_SECRET || 'test_token_secret_min_16_chars_recovery';
    mockTransport = new MockEmailTransport();
    setEmailTransport(mockTransport);

    const timestamp = Date.now();
    testProduct = await prisma.product.create({
      data: {
        code: `REC_PROD_${timestamp}`,
        slug: `rec-prod-${timestamp}`,
        name: 'Recovery Test Suite',
        description: 'Test product for license recovery',
        price: 39.0,
        priceMinor: 48000,
        currency: 'INR',
      },
    });

    const licenseKey = `NAV-${crypto.randomBytes(2).toString('hex').toUpperCase()}-RECV-KEY1-9999`;
    testLicense = await prisma.license.create({
      data: {
        email: testEmail,
        productId: testProduct.id,
        licenseKey,
        keyLookupHash: crypto.createHash('sha256').update(licenseKey).digest('hex'),
        status: 'ACTIVE',
        maxActivations: 1,
      },
    });

    testActivation = await prisma.activation.create({
      data: {
        licenseId: testLicense.id,
        machineIdHash: machineHash,
        status: 'ACTIVE',
      },
    });
  });

  after(async () => {
    setEmailTransport(null);

    await prisma.recoveryToken.deleteMany({
      where: { email: testEmail },
    }).catch(() => {});
    await prisma.emailOutbox.deleteMany({
      where: { toEmail: testEmail },
    }).catch(() => {});
    await prisma.auditEvent.deleteMany({
      where: { refType: 'LICENSE', refId: testLicense?.id },
    }).catch(() => {});
    await prisma.activation.deleteMany({
      where: { licenseId: testLicense?.id },
    }).catch(() => {});
    await prisma.license.deleteMany({
      where: { productId: testProduct?.id },
    }).catch(() => {});
    await prisma.product.deleteMany({
      where: { id: testProduct?.id },
    }).catch(() => {});
  });

  it('should return identical generic responses for both known and unknown emails (anti-enumeration)', async () => {
    // 1. Known email
    const reqKnown = new NextRequest('http://localhost:3000/api/license/recover', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.3.1',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const resKnown = await recoverRequestHandler(reqKnown);
    assert.strictEqual(resKnown.status, 200);
    const dataKnown = await resKnown.json();

    // 2. Unknown email
    const reqUnknown = new NextRequest('http://localhost:3000/api/license/recover', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.3.2',
      },
      body: JSON.stringify({ email: unknownEmail }),
    });

    const resUnknown = await recoverRequestHandler(reqUnknown);
    assert.strictEqual(resUnknown.status, 200);
    const dataUnknown = await resUnknown.json();

    // Responses must be completely indistinguishable
    assert.strictEqual(dataKnown.success, true);
    assert.strictEqual(dataUnknown.success, true);
    assert.strictEqual(dataKnown.message, dataUnknown.message);

    // Verify recovery email was sent strictly to known email
    const sentToKnown = mockTransport.sentMails.find((m) => m.to === testEmail);
    const sentToUnknown = mockTransport.sentMails.find((m) => m.to === unknownEmail);
    assert.ok(sentToKnown, 'Recovery email must be dispatched to registered customer email');
    assert.strictEqual(sentToUnknown, undefined, 'No email must be sent to unregistered addresses');
  });

  it('should redeem a valid recovery token, queue recovery email to customer, prevent key leakage in API response, and preserve machine activations', async () => {
    // Retrieve stored recovery token from DB
    const tokenRecord = await prisma.recoveryToken.findFirst({
      where: { email: testEmail, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(tokenRecord, 'RecoveryToken row must exist in DB');

    // Find the raw token from the sent email link
    const initialMail = mockTransport.sentMails.find((m) => m.to === testEmail);
    assert.ok(initialMail);
    const match = initialMail.text.match(/token=([a-f0-9]{64})/);
    assert.ok(match, 'Token must be present in email body');
    const rawToken = match[1];

    const req = new NextRequest(`http://localhost:3000/api/recovery/redeem?token=${rawToken}`, {
      method: 'GET',
      headers: {
        'x-forwarded-for': '192.168.3.3',
      },
    });

    const res = await redeemHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.strictEqual(data.success, true);
    assert.strictEqual(data.recovered_count, 1);
    // Security verification: NO raw or masked license key in API response
    assert.strictEqual(data.licenses, undefined, 'API response must never return license keys or arrays to the browser');

    // Verify recovery email was queued and dispatched strictly to the registered purchase email
    const recoveryEmails = mockTransport.sentMails.filter((m) => m.subject.includes('Recovered License Key'));
    assert.strictEqual(recoveryEmails.length, 1, 'Exactly one recovery email must be sent');
    assert.strictEqual(recoveryEmails[0].to, testEmail, 'Email must go strictly to original purchase email');

    // Verify machine activation was NOT reset (Task 7 requirement)
    const activations = await prisma.activation.findMany({
      where: { licenseId: testLicense.id },
    });
    assert.strictEqual(activations.length, 1);
    assert.strictEqual(activations[0].machineIdHash, machineHash);
    assert.strictEqual(activations[0].status, 'ACTIVE');
  });

  it('should reject reuse of already-redeemed recovery token (410 Gone)', async () => {
    const sentMail = mockTransport.sentMails.find((m) => m.to === testEmail);
    assert.ok(sentMail);
    const match = sentMail.text.match(/token=([a-f0-9]{64})/);
    assert.ok(match);
    const rawToken = match[1];

    // Second redemption attempt
    const req = new NextRequest(`http://localhost:3000/api/recovery/redeem?token=${rawToken}`, {
      method: 'GET',
      headers: {
        'x-forwarded-for': '192.168.3.4',
      },
    });

    const res = await redeemHandler(req);
    assert.strictEqual(res.status, 410);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'TOKEN_ALREADY_USED');
  });

  it('should reject expired recovery token (410 Gone)', async () => {
    // Insert pre-expired token in DB
    const expiredRaw = crypto.randomBytes(32).toString('hex');
    const expiredHash = crypto.createHash('sha256').update(expiredRaw).digest('hex');

    await prisma.recoveryToken.create({
      data: {
        email: testEmail,
        tokenHash: expiredHash,
        expiresAt: new Date(Date.now() - 60000), // expired 1 minute ago
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/recovery/redeem?token=${expiredRaw}`, {
      method: 'GET',
      headers: {
        'x-forwarded-for': '192.168.3.5',
      },
    });

    const res = await redeemHandler(req);
    assert.strictEqual(res.status, 410);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'TOKEN_EXPIRED');
  });
});
