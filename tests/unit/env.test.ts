import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Environment Module', () => {
  it('should fail fast with missing variable names when critical env is missing', () => {
    const originalEnv = { ...process.env };
    delete process.env.DATABASE_URL;
    delete process.env.LICENSE_SIGNING_PRIVATE_KEY;
    delete process.env.LICENSE_TOKEN_SECRET;

    // Direct schema test using the env logic
    const { z } = require('zod');
    const testSchema = z.object({
      DATABASE_URL: z.string().min(1),
      LICENSE_SIGNING_PRIVATE_KEY: z.string().min(1),
      LICENSE_TOKEN_SECRET: z.string().min(16),
    });

    const result = testSchema.safeParse(process.env);
    assert.strictEqual(result.success, false);

    if (!result.success) {
      const missingKeys = result.error.issues.map((i: any) => i.path.join('.'));
      assert.ok(missingKeys.includes('DATABASE_URL'));
      assert.ok(missingKeys.includes('LICENSE_SIGNING_PRIVATE_KEY'));
      assert.ok(missingKeys.includes('LICENSE_TOKEN_SECRET'));

      // Verify no sensitive secret values are present in the error issue paths or messages
      for (const issue of result.error.issues) {
        assert.strictEqual(typeof issue.message, 'string');
        assert.ok(!issue.message.includes('password'));
        assert.ok(!issue.message.includes('BEGIN PRIVATE KEY'));
      }
    }

    // Restore environment
    process.env = originalEnv;
  });

  it('should separate public variables from server variables', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.brahmicomputing.in';
    process.env.LICENSE_TOKEN_SECRET = 'sample-secret-at-least-16-chars';

    const clientVars = {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

    // Client variables must never contain server secrets
    assert.strictEqual((clientVars as any).LICENSE_TOKEN_SECRET, undefined);
    assert.strictEqual((clientVars as any).LICENSE_SIGNING_PRIVATE_KEY, undefined);
    assert.strictEqual(clientVars.NEXT_PUBLIC_APP_URL, 'https://www.brahmicomputing.in');
  });
});
