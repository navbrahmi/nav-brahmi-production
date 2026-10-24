import { describe, it } from 'node:test';
import assert from 'node:assert';
import { logger } from '../../src/lib/logger';

describe('Structured Redacting Logger', () => {
  it('should redact license keys from messages and context', () => {
    let capturedLog: any = null;
    const originalLog = console.log;
    console.log = (msg: string) => {
      capturedLog = JSON.parse(msg);
    };

    try {
      logger.info('Processed license NAV-ABCD-1234-EF56-7890 for customer', {
        licenseKey: 'NAV-ABCD-1234-EF56-7890',
        customerEmail: 'testuser@example.com',
      });

      assert.ok(capturedLog);
      assert.ok(!capturedLog.message.includes('NAV-ABCD-1234-EF56-7890'));
      assert.ok(capturedLog.message.includes('[REDACTED_LICENSE_KEY]'));
      assert.ok(capturedLog.licenseKey.includes('[REDACTED'));
      assert.ok(!capturedLog.customerEmail.includes('testuser@'));
      assert.ok(capturedLog.customerEmail.includes('@example.com'));
    } finally {
      console.log = originalLog;
    }
  });

  it('should redact authorization headers and presigned URLs', () => {
    let capturedLog: any = null;
    const originalLog = console.log;
    console.log = (msg: string) => {
      capturedLog = JSON.parse(msg);
    };

    try {
      logger.info('Request header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret', {
        downloadUrl: 'https://bucket.r2.cloudflarestorage.com/package.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abcdef1234567890',
      });

      assert.ok(capturedLog);
      assert.ok(capturedLog.message.includes('Bearer [REDACTED_AUTH]'));
      assert.ok(!capturedLog.message.includes('eyJhbGciOiJIUzI1Ni'));
      assert.ok(!capturedLog.downloadUrl.includes('X-Amz-Signature=abcdef'));
    } finally {
      console.log = originalLog;
    }
  });
});
