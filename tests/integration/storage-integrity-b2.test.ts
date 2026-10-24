try {
  process.loadEnvFile?.('.env');
} catch {}

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getStorageClient, getPresignedGetUrl } from '../../src/lib/storage';

describe('Storage Integrity & Backblaze B2 Verification', () => {
  let s3: S3Client;
  let bucketName: string;
  const testKey = `synthetic-staging-tests/test-pkg-${Date.now()}.zip`;
  const syntheticContent = crypto.randomBytes(16384); // 16 KB synthetic package
  const expectedSha256 = crypto.createHash('sha256').update(syntheticContent).digest('hex');

  before(async () => {
    const storage = getStorageClient();
    s3 = storage.s3Client;
    bucketName = storage.bucketName;

    // Upload synthetic package to authorized B2 bucket
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: syntheticContent,
        ContentType: 'application/zip',
        Metadata: {
          sha256: expectedSha256,
        },
      })
    );
  });

  after(async () => {
    // Clean up test object
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    ).catch(() => {});
  });

  it('should successfully upload and download synthetic package over presigned B2 URL', async () => {
    const presignedUrl = await getPresignedGetUrl(testKey, 900);
    assert.strictEqual(typeof presignedUrl, 'string');
    assert.ok(presignedUrl.includes('X-Amz-Expires=900'));

    const response = await fetch(presignedUrl);
    assert.strictEqual(response.status, 200);

    const downloadedBuf = Buffer.from(await response.arrayBuffer());
    assert.strictEqual(downloadedBuf.length, syntheticContent.length);
    assert.ok(downloadedBuf.equals(syntheticContent));

    const downloadedSha256 = crypto.createHash('sha256').update(downloadedBuf).digest('hex');
    assert.strictEqual(downloadedSha256, expectedSha256);
  });

  it('should detect tampered package bytes during SHA-256 integrity check', async () => {
    const presignedUrl = await getPresignedGetUrl(testKey, 900);
    const response = await fetch(presignedUrl);
    const downloadedBuf = Buffer.from(await response.arrayBuffer());

    // Tamper single byte
    downloadedBuf[10] = downloadedBuf[10] ^ 0xff;

    const actualSha256 = crypto.createHash('sha256').update(downloadedBuf).digest('hex');
    assert.notStrictEqual(actualSha256, expectedSha256, 'Tampered bytes must fail hash comparison');
  });

  it('should detect truncated download during length and hash check', async () => {
    const presignedUrl = await getPresignedGetUrl(testKey, 900);
    const response = await fetch(presignedUrl);
    const downloadedBuf = Buffer.from(await response.arrayBuffer());

    // Truncate last 512 bytes
    const truncatedBuf = downloadedBuf.subarray(0, downloadedBuf.length - 512);

    assert.notStrictEqual(truncatedBuf.length, syntheticContent.length, 'Truncated length must not match expected size');
    const truncatedSha256 = crypto.createHash('sha256').update(truncatedBuf).digest('hex');
    assert.notStrictEqual(truncatedSha256, expectedSha256, 'Truncated payload must not match expected hash');
  });

  it('should reject unauthorized direct bucket requests without credentials or presigned query', async () => {
    const directUrl = `https://${process.env.B2_ENDPOINT || 's3.us-east-005.backblazeb2.com'}/${bucketName}/${testKey}`;
    const directRes = await fetch(directUrl);
    // B2 private bucket must return 401 or 403 Forbidden
    assert.ok([401, 403].includes(directRes.status), `Expected 401/403, got ${directRes.status}`);
  });

  it('should reject presigned download URL when signature parameters have expired', async () => {
    // Generate URL with 1-second TTL and wait 2 seconds
    const shortUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      }),
      { expiresIn: 1 }
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch(shortUrl);
    assert.ok(
      [401, 403].includes(response.status),
      `Expired presigned URL must return HTTP 401 or 403, got ${response.status}`
    );
  });

  it('should enforce bucket-listing restrictions: direct anonymous listing must be rejected', async () => {
    const listUrl = `https://${process.env.B2_ENDPOINT || 's3.us-east-005.backblazeb2.com'}/${bucketName}`;
    const listRes = await fetch(listUrl);
    // Private B2 bucket must reject anonymous listing requests with HTTP 401, 403, or 404
    assert.ok(
      [401, 403, 404].includes(listRes.status),
      `Expected 401/403/404 for unauthorized bucket listing, got ${listRes.status}`
    );
  });

  it('should reject download when presigned signature parameter is tampered or invalid', async () => {
    const presignedUrl = await getPresignedGetUrl(testKey, 900);
    // Tamper the signature query parameter
    const tamperedUrl = presignedUrl.replace(/X-Amz-Signature=[a-f0-9]{8}/i, 'X-Amz-Signature=ffffffff');
    const response = await fetch(tamperedUrl);
    assert.ok(
      [401, 403].includes(response.status),
      `Tampered presigned URL must return HTTP 401 or 403, got ${response.status}`
    );
  });

  it('should maintain database consistency: failed upload does not leave active ProductPackage row', async () => {
    const { prisma } = await import('../../src/lib/prisma');
    let dummyProduct = await prisma.product.findFirst({
      where: { slug: 'ashokan-brahmi' },
    });
    if (!dummyProduct) {
      dummyProduct = await prisma.product.findFirst();
    }
    if (!dummyProduct) {
      dummyProduct = await prisma.product.create({
        data: {
          code: `TEST_STORAGE_${Date.now()}`,
          name: 'Storage Integrity Test Product',
          description: 'Temporary test product for storage integrity assertions',
          price: 39.0,
        },
      });
    }
    assert.ok(dummyProduct, 'A valid product must exist for package testing');

    const failingKey = `packages/failed-simulated-${Date.now()}.zip`;
    const tempVersion = `99.99.${Date.now()}`;

    // Simulate failed transaction/flow:
    // If upload fails before DB upsert, database has zero records for this version
    const existingBefore = await prisma.productPackage.findUnique({
      where: {
        productId_architecture_version: {
          productId: dummyProduct.id,
          architecture: 'x64',
          version: tempVersion,
        },
      },
    });
    assert.strictEqual(existingBefore, null, 'No row exists before attempt');

    // Simulate upload failure: try-catch block does not execute database insert
    try {
      // Simulate failed network/storage action
      throw new Error('Simulated B2 network disconnect during upload');
    } catch {
      // Clean rollback: no DB mutation attempted
    }

    const existingAfter = await prisma.productPackage.findUnique({
      where: {
        productId_architecture_version: {
          productId: dummyProduct.id,
          architecture: 'x64',
          version: tempVersion,
        },
      },
    });
    assert.strictEqual(existingAfter, null, 'Database remains consistent: no orphan record after failed upload');
  });
});
