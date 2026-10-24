import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { getPresignedGetUrl, resolveProductPackage } from '../../src/lib/storage';
import { prisma } from '../../src/lib/prisma';

describe('Storage Module Verification (Backblaze B2 Confirmed Storage)', () => {
  it('should generate presigned GET URLs with maximum TTL capped at 900 seconds (15m)', async () => {
    // Set minimal storage config for presigner verification
    process.env.STORAGE_PROVIDER = 'b2';
    process.env.B2_KEY_ID = 'test_key_id';
    process.env.B2_APPLICATION_KEY = 'test_app_key';

    const url = await getPresignedGetUrl('test/package.zip', 3600); // Requests 1 hour, must cap to 15m
    assert.strictEqual(typeof url, 'string');
    assert.ok(url.includes('X-Amz-Expires=900')); // Strictly capped to 900 seconds
  });

  it('should raise an error for unknown product or architecture (never fall back to Tamil Grantha)', async () => {
    await assert.rejects(
      async () => {
        await resolveProductPackage('UNKNOWN_SCRIPT_PRODUCT_999', 'x64');
      },
      {
        message: /Product package not found for product "UNKNOWN_SCRIPT_PRODUCT_999"/,
      }
    );
  });

  it('should correctly resolve valid product package from database', async () => {
    // Seed a test product and package in scratch database
    const testCode = `PROD_${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        code: testCode,
        slug: testCode.toLowerCase(),
        name: 'Test Script Driver',
        description: 'Synthetic driver package for testing',
        price: 39.0,
        priceMinor: 48000,
        currency: 'INR',
        packages: {
          create: {
            version: '1.0.0',
            architecture: 'x64',
            objectKey: `packages/${testCode.toLowerCase()}-x64.zip`,
            sha256: crypto.randomBytes(32).toString('hex'),
            sizeBytes: BigInt(1024),
          },
        },
      },
    });

    const resolved = await resolveProductPackage(testCode, 'x64');
    assert.strictEqual(resolved.version, '1.0.0');
    assert.strictEqual(resolved.objectKey, `packages/${testCode.toLowerCase()}-x64.zip`);
  });

  it('verifies storage provider fallback behavior when configured (Backblaze B2 is confirmed primary; R2 cancelled per C-05)', async () => {
    const hasR2Creds =
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME;

    if (!hasR2Creds) {
      console.log('Skipping optional storage fallback check: credentials not configured in environment.');
      return;
    }

    // Generate synthetic file at test time (never committed)
    const syntheticData = crypto.randomBytes(128);
    const syntheticKey = `synthetic-tests/${Date.now()}.bin`;

    const { uploadObject, headObject } = require('../../src/lib/storage');
    process.env.STORAGE_PROVIDER = 'r2';

    await uploadObject(syntheticKey, syntheticData, 'application/octet-stream');
    const head = await headObject(syntheticKey);
    assert.ok(head);
    assert.strictEqual(head.sizeBytes, 128);
  });
});
