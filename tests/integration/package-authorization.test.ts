import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/prisma';
import { POST as packageAuthHandler } from '../../src/app/api/package/authorize/route';
import { signActivationToken } from '../../src/lib/keys';

describe('Package Authorization API (/api/package/authorize)', () => {
  let originalKey: string | undefined;
  let originalPub: string | undefined;
  let testProduct: any;
  let testPackage: any;
  let testLicense: any;
  let testActivation: any;
  let validToken: string;
  const machineA = 'machine_pkg_auth_test_001';
  const machineAHash = crypto.createHash('sha256').update(machineA).digest('hex');

  before(async () => {
    originalKey = process.env.LICENSE_SIGNING_PRIVATE_KEY;
    originalPub = process.env.LICENSE_SIGNING_PUBLIC_KEY;

    const keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    process.env.LICENSE_SIGNING_PRIVATE_KEY = keyPair.privateKey;
    process.env.LICENSE_SIGNING_PUBLIC_KEY = keyPair.publicKey;

    // Seed test product and package
    const timestamp = Date.now();
    testProduct = await prisma.product.create({
      data: {
        code: `PKG_PROD_${timestamp}`,
        slug: `pkg-prod-${timestamp}`,
        name: 'Package Auth Test Driver',
        description: 'Test product for package download authorization',
        price: 39.0,
        priceMinor: 48000,
        currency: 'INR',
        packages: {
          create: {
            architecture: 'x64',
            version: '1.0.0',
            objectKey: `packages/pkg-prod-${timestamp}-x64-1.0.0.zip`,
            sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
            sizeBytes: BigInt(2048576),
            isActive: true,
          },
        },
      },
      include: { packages: true },
    });

    testPackage = testProduct.packages[0];

    const licenseKey = `NAV-${crypto.randomBytes(2).toString('hex').toUpperCase()}-PKG1-TEST-1111`;
    testLicense = await prisma.license.create({
      data: {
        email: 'pkg.test@example.com',
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
        machineIdHash: machineAHash,
        status: 'ACTIVE',
      },
    });

    validToken = signActivationToken({
      lic: testLicense.id,
      prd: testProduct.code,
      mch: machineAHash,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      status: 'ACTIVE',
    });
  });

  after(async () => {
    process.env.LICENSE_SIGNING_PRIVATE_KEY = originalKey;
    process.env.LICENSE_SIGNING_PUBLIC_KEY = originalPub;

    await prisma.auditEvent.deleteMany({
      where: { refType: 'LICENSE', refId: testLicense?.id },
    }).catch(() => {});
    await prisma.activation.deleteMany({
      where: { licenseId: testLicense?.id },
    }).catch(() => {});
    await prisma.license.deleteMany({
      where: { productId: testProduct?.id },
    }).catch(() => {});
    await prisma.productPackage.deleteMany({
      where: { productId: testProduct?.id },
    }).catch(() => {});
    await prisma.product.deleteMany({
      where: { id: testProduct?.id },
    }).catch(() => {});
  });

  it('should authorize valid package request and return presigned Backblaze B2 download URL', async () => {
    const req = new NextRequest('http://localhost:3000/api/package/authorize', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.2.10',
      },
      body: JSON.stringify({
        token: validToken,
        machine_id: machineA,
        architecture: 'x64',
      }),
    });

    const res = await packageAuthHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.strictEqual(data.success, true);
    assert.strictEqual(typeof data.url, 'string');
    assert.ok(data.url.includes('X-Amz-Expires=900'));
    assert.strictEqual(data.sha256, testPackage.sha256);
    assert.strictEqual(data.sizeBytes, Number(testPackage.sizeBytes));
    assert.strictEqual(data.architecture, 'x64');
  });

  it('should reject package authorization when token is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/package/authorize', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        machine_id: machineA,
      }),
    });

    const res = await packageAuthHandler(req);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'MISSING_TOKEN');
  });

  it('should reject package authorization with invalid or tampered token', async () => {
    const [payloadB64, sigB64] = validToken.split('.');
    const tamperedToken = `${payloadB64}.${sigB64.slice(0, -6)}ZZZZZZ`;

    const req = new NextRequest('http://localhost:3000/api/package/authorize', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        token: tamperedToken,
        machine_id: machineA,
      }),
    });

    const res = await packageAuthHandler(req);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'INVALID_TOKEN');
  });

  it('should reject package authorization with expired token', async () => {
    const expiredToken = signActivationToken({
      lic: testLicense.id,
      prd: testProduct.code,
      mch: machineAHash,
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      status: 'ACTIVE',
    });

    const req = new NextRequest('http://localhost:3000/api/package/authorize', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        token: expiredToken,
        machine_id: machineA,
      }),
    });

    const res = await packageAuthHandler(req);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.message.includes('expired'));
  });

  it('should reject package authorization when machine ID does not match token binding', async () => {
    const req = new NextRequest('http://localhost:3000/api/package/authorize', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        token: validToken,
        machine_id: 'attacker_unauthorized_machine_999',
      }),
    });

    const res = await packageAuthHandler(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'MACHINE_MISMATCH');
  });

  it('should reject unapproved architecture (arm64, ia64) per Task 3 and C-06', async () => {
    const req = new NextRequest('http://localhost:3000/api/package/authorize', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        token: validToken,
        machine_id: machineA,
        architecture: 'arm64',
      }),
    });

    const res = await packageAuthHandler(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'UNSUPPORTED_ARCHITECTURE');
    assert.ok(data.error.message.includes('arm64'));
  });

  it('should return 404 when package is not registered for product without falling back to Tamil Grantha (F-08)', async () => {
    // Generate valid token for product that has no x86 package registered
    const req = new NextRequest('http://localhost:3000/api/package/authorize', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        token: validToken,
        machine_id: machineA,
        architecture: 'x86', // only x64 is registered
      }),
    });

    const res = await packageAuthHandler(req);
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'PACKAGE_NOT_FOUND');
    // Crucial: Must NEVER fallback to Tamil Grantha or any default
    assert.strictEqual(data.url, undefined);
  });
});
