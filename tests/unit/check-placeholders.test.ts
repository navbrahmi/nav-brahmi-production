import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'child_process';
import path from 'path';

describe('Phase 3 Placeholder Verification Script', () => {
  const scriptPath = path.join(process.cwd(), 'scripts', 'check-placeholders.ts');

  it('should fail with exit code 1 in strict mode while unsupplied client placeholders remain', () => {
    let exitedWithError = false;
    let stdout = '';

    try {
      execSync(`npx tsx "${scriptPath}"`, {
        env: { ...process.env, ALLOW_PLACEHOLDERS: 'false' },
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (err: any) {
      exitedWithError = true;
      const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '');
      assert.ok(output.includes('PRODUCTION BUILD FAILURE'));
    }

    assert.ok(exitedWithError, 'Expected strict placeholder check to exit with code 1');
  });

  it('should exit with code 0 when ALLOW_PLACEHOLDERS=true is enabled for development', () => {
    const result = execSync(`npx tsx "${scriptPath}"`, {
      env: { ...process.env, ALLOW_PLACEHOLDERS: 'true' },
      encoding: 'utf8',
    });

    assert.ok(result.includes('ALLOW_PLACEHOLDERS=true is set. Permitting build'));
  });
});
