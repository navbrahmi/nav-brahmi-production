import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/prisma';
import { POST as activateHandler } from '../../src/app/api/activation/route';
import { POST as validateHandler } from '../../src/app/api/validate-license/route';
import { verifyActivationToken } from '../../src/lib/keys';

describe('Activation & License Validation APIs (/api/activation & /api/validate-license)', () => {
  let originalKey: string | undefined;
  let originalPub: string | undefined;
  let testProduct: any;
  let testLicenseKey: string;
  let testLicense: any;
  const machineA = 'machine_alpha_guid_uuid_001';
  const machineB = 'machine_beta_guid_uuid_002';

  before(async () => {
    originalKey = process.env.LICENSE_SIGNING_PRIVATE_KEY;
    originalPub = process.env.LICENSE_SIGNING_PUBLIC_KEY;

    // Generate fresh synthetic keypair for tests
    const keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    process.env.LICENSE_SIGNING_PRIVATE_KEY = keyPair.privateKey;
    process.env.LICENSE_SIGNING_PUBLIC_KEY = keyPair.publicKey;

    // Create test product in DB
    const timestamp = Date.now();
    testProduct = await prisma.product.create({
      data: {
        code: `ACT_PROD_${timestamp}`,
        slug: `act-prod-${timestamp}`,
        name: 'Activation Test Driver',
        description: 'Test product for activation engine',
        price: 39.0,
        priceMinor: 48000,
        currency: 'INR',
      },
    });

    testLicenseKey = `NAV-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}-AAAA-BBBB`;
    const keyHash = crypto.createHash('sha256').update(testLicenseKey).digest('hex');

    testLicense = await prisma.license.create({
      data: {
        email: 'act.test@example.com',
        productId: testProduct.id,
        licenseKey: testLicenseKey,
        keyLookupHash: keyHash,
        status: 'ACTIVE',
        maxActivations: 1, // Default 1 machine per C-07 baseline
      },
    });
  });

  after(async () => {
    process.env.LICENSE_SIGNING_PRIVATE_KEY = originalKey;
    process.env.LICENSE_SIGNING_PUBLIC_KEY = originalPub;

    // Cleanup
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

  it('should validate an active license without returning download URLs (F-06)', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate-license', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.101',
      },
      body: JSON.stringify({
        license_key: testLicenseKey,
        product_code: testProduct.code,
      }),
    });

    const res = await validateHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.valid, true);
    assert.strictEqual(data.license_id, testLicense.id);
    assert.strictEqual(data.max_activations, 1);
    assert.strictEqual(data.activations_count, 0);
    // Strict security check: validation must NOT return download URLs
    assert.strictEqual(data.download_urls, undefined);
    assert.strictEqual(data.url, undefined);
  });

  it('should reject validation for wrong product code', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate-license', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.102',
      },
      body: JSON.stringify({
        license_key: testLicenseKey,
        product_code: 'WRONG_PRODUCT_CODE_XYZ',
      }),
    });

    const res = await validateHandler(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.valid, false);
    assert.strictEqual(data.error.code, 'PRODUCT_MISMATCH');
  });

  it('should successfully activate a license on Machine A and issue Ed25519 token', async () => {
    const req = new NextRequest('http://localhost:3000/api/activation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.103',
      },
      body: JSON.stringify({
        license_key: testLicenseKey,
        machine_id: machineA,
        product_code: testProduct.code,
      }),
    });

    const res = await activateHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.activated, true);
    assert.strictEqual(typeof data.token, 'string');

    // Cryptographically verify returned token
    const machineAHash = crypto.createHash('sha256').update(machineA).digest('hex');
    const verification = verifyActivationToken(data.token, machineAHash);
    assert.strictEqual(verification.valid, true);
    assert.strictEqual(verification.payload?.lic, testLicense.id);
    assert.strictEqual(verification.payload?.prd, testProduct.code);
  });

  it('should idempotently re-activate on Machine A without consuming additional activations', async () => {
    const req = new NextRequest('http://localhost:3000/api/activation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.104',
      },
      body: JSON.stringify({
        license_key: testLicenseKey,
        machine_id: machineA,
      }),
    });

    const res = await activateHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.message.includes('Authorized machine recognized'));

    // Check database has strictly 1 activation record
    const activations = await prisma.activation.findMany({
      where: { licenseId: testLicense.id },
    });
    assert.strictEqual(activations.length, 1);
  });

  it('should reject activation on Machine B when limit is reached without leaking Machine A hash (F-11)', async () => {
    const req = new NextRequest('http://localhost:3000/api/activation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.105',
      },
      body: JSON.stringify({
        license_key: testLicenseKey,
        machine_id: machineB,
      }),
    });

    const res = await activateHandler(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.activated, false);
    assert.strictEqual(data.error.code, 'ACTIVATION_LIMIT_REACHED');

    // F-11 remediation verification: must NOT leak bound machine hash in response
    assert.strictEqual(data.bound_machine_id, undefined);
    assert.strictEqual(data.attempted_machine_id, undefined);
  });

  it('should reject activation on revoked license', async () => {
    // Revoke license in DB
    await prisma.license.update({
      where: { id: testLicense.id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    const req = new NextRequest('http://localhost:3000/api/activation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.106',
      },
      body: JSON.stringify({
        license_key: testLicenseKey,
        machine_id: machineA,
      }),
    });

    const res = await activateHandler(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'LICENSE_REVOKED');

    // Restore to ACTIVE for remaining tests
    await prisma.license.update({
      where: { id: testLicense.id },
      data: { status: 'ACTIVE' },
    });
  });

  it('should reject activation on expired license', async () => {
    await prisma.license.update({
      where: { id: testLicense.id },
      data: { status: 'EXPIRED' },
    });

    const req = new NextRequest('http://localhost:3000/api/activation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.107',
      },
      body: JSON.stringify({
        license_key: testLicenseKey,
        machine_id: machineA,
      }),
    });

    const res = await activateHandler(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'LICENSE_EXPIRED');

    await prisma.license.update({
      where: { id: testLicense.id },
      data: { status: 'ACTIVE' },
    });
  });

  it('should reject activation on non-existent license key', async () => {
    const req = new NextRequest('http://localhost:3000/api/activation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.108',
      },
      body: JSON.stringify({
        license_key: 'NAV-9999-9999-9999-9999',
        machine_id: 'any_machine',
      }),
    });

    const res = await activateHandler(req);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'INVALID_LICENSE');
  });

  it('should handle concurrent activation requests safely under exclusive row locks', async () => {
    // Create new unactivated license with limit 1
    const freshKey = `NAV-CONC-CONC-${Date.now().toString().slice(-4)}-1111`;
    const keyHash = crypto.createHash('sha256').update(freshKey).digest('hex');
    const freshLicense = await prisma.license.create({
      data: {
        email: 'conc.act@example.com',
        productId: testProduct.id,
        licenseKey: freshKey,
        keyLookupHash: keyHash,
        status: 'ACTIVE',
        maxActivations: 1,
      },
    });

    // Fire 5 concurrent activation requests for 5 different machines simultaneously
    const machines = ['mach_c1', 'mach_c2', 'mach_c3', 'mach_c4', 'mach_c5'];
    const responses = await Promise.all(
      machines.map((m, idx) =>
        activateHandler(
          new NextRequest('http://localhost:3000/api/activation', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': `192.168.1.${120 + idx}`,
            },
            body: JSON.stringify({
              license_key: freshKey,
              machine_id: m,
            }),
          })
        )
      )
    );

    const statuses = responses.map((r) => r.status);
    const successCount = statuses.filter((s) => s === 200).length;
    const rejectedCount = statuses.filter((s) => s === 403).length;

    // Exactly 1 machine should succeed; exactly 4 should be rejected with 403
    assert.strictEqual(successCount, 1, 'Exactly one concurrent machine must win');
    assert.strictEqual(rejectedCount, 4, 'All other concurrent machines must be rejected');

    const dbActivations = await prisma.activation.findMany({
      where: { licenseId: freshLicense.id },
    });
    assert.strictEqual(dbActivations.length, 1, 'Database must have exactly 1 activation row');

    // Cleanup
    await prisma.activation.deleteMany({ where: { licenseId: freshLicense.id } });
    await prisma.license.delete({ where: { id: freshLicense.id } });
  });
});
