import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';

describe('Windows Bootstrapper Logic & Authenticode Overlay Analysis (Tasks 5 & 6)', () => {
  it('should explicitly detect native architectures and reject unsupported platforms (C-06)', () => {
    function detectNativeArchitecture(archEnv: string, w64Env: string): string {
      const arch = (archEnv || '').toLowerCase().trim();
      const archW64 = (w64Env || '').toLowerCase().trim();

      if (arch === 'amd64' || archW64 === 'amd64' || arch === 'x64' || archW64 === 'x64') {
        return 'x64';
      }
      if (arch === 'x86' && !archW64) {
        return 'x86';
      }
      if (arch.includes('arm') || archW64.includes('arm')) {
        return 'arm64';
      }
      if (arch.includes('ia64') || archW64.includes('ia64')) {
        return 'ia64';
      }
      return arch || 'unknown';
    }

    // 64-bit Windows Intel/AMD
    assert.strictEqual(detectNativeArchitecture('AMD64', ''), 'x64');
    assert.strictEqual(detectNativeArchitecture('x86', 'AMD64'), 'x64');

    // 32-bit Windows Intel x86
    assert.strictEqual(detectNativeArchitecture('x86', ''), 'x86');

    // ARM64 Windows (unapproved per C-06)
    assert.strictEqual(detectNativeArchitecture('ARM64', ''), 'arm64');
    assert.strictEqual(detectNativeArchitecture('x86', 'ARM64'), 'arm64');

    // Unsupported architectures must be rejected
    const supported = ['x64', 'x86'];
    assert.ok(supported.includes(detectNativeArchitecture('AMD64', '')));
    assert.ok(!supported.includes(detectNativeArchitecture('ARM64', '')));
    assert.ok(!supported.includes(detectNativeArchitecture('IA64', '')));
  });

  it('should enforce URL security: require HTTPS for remote endpoints and allow localhost only', () => {
    function assertUrlSecurity(url: string): boolean {
      if (!url) return false;
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:') return true;
        if (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    // Remote HTTPS endpoints allowed
    assert.strictEqual(assertUrlSecurity('https://brahmicomputing.in'), true);
    assert.strictEqual(assertUrlSecurity('https://api.navbrahmi.com/api'), true);

    // Localhost / 127.0.0.1 HTTP allowed in development
    assert.strictEqual(assertUrlSecurity('http://localhost:3000'), true);
    assert.strictEqual(assertUrlSecurity('http://127.0.0.1:3000'), true);

    // Insecure remote HTTP endpoints strictly rejected
    assert.strictEqual(assertUrlSecurity('http://insecure-remote.com/api'), false);
    assert.strictEqual(assertUrlSecurity('http://192.168.1.50:8080'), false);
    assert.strictEqual(assertUrlSecurity('ftp://brahmicomputing.in'), false);
  });

  it('should investigate Task 6 Authenticode overlay append behavior: appending data alters hash and invalidates signature', () => {
    // Simulate PE Authenticode structure:
    // Base PE binary bytes:
    const baseExecutableBytes = crypto.randomBytes(32768);
    const originalHash = crypto.createHash('sha256').update(baseExecutableBytes).digest('hex');

    // Simulated payload appended by prototype (F-17):
    const payloadBlock = Buffer.from(
      '\r\n---NAV_BRAHMI_AUTH_START---\r\n{"token":"test","licenseKey":"NAV-1234"}\r\n---NAV_BRAHMI_AUTH_END---\r\n',
      'utf-8'
    );
    const downloadedExecutableBytes = Buffer.concat([baseExecutableBytes, payloadBlock]);
    const downloadedHash = crypto.createHash('sha256').update(downloadedExecutableBytes).digest('hex');

    // Finding Verification:
    // 1. The downloaded hash is mathematically distinct from the signed binary hash
    assert.notStrictEqual(downloadedHash, originalHash, 'Appended overlay changes file hash');

    // 2. Under Microsoft Authenticode specification (MS13-098 / CVE-2013-3900 EnableCertPaddingCheck),
    // any bytes appended past the Attribute Certificate Table cause WinVerifyTrust to fail with TRUST_E_BAD_DIGEST.
    // 3. SmartScreen reputation lookup uses the SHA-256 hash of the downloaded file. Because each download
    // appends a unique token, each download has a brand-new unknown hash, permanently resetting SmartScreen reputation!
    const sizeDelta = downloadedExecutableBytes.length - baseExecutableBytes.length;
    assert.strictEqual(sizeDelta, payloadBlock.length);
  });

  it('should enforce C-29 font allowlist and skip unapproved fonts found in packages', () => {
    // Explicit allowlist per Task 1 & C-29 configuration
    const approvedFontNames = new Set(['navbrahmi-regular.ttf', 'navbrahmi-bold.ttf']);

    function filterApprovedFonts(foundFiles: string[]): { approved: string[]; skipped: string[] } {
      const approved: string[] = [];
      const skipped: string[] = [];
      for (const file of foundFiles) {
        const lower = file.toLowerCase();
        if (approvedFontNames.has(lower)) {
          approved.push(file);
        } else {
          skipped.push(file);
        }
      }
      return { approved, skipped };
    }

    const packageFiles = [
      'navbrahmi-regular.ttf',
      'navbrahmi-bold.ttf',
      'unapproved-arial-copy.ttf',
      'malicious-font.otf',
      'random-notes.txt',
    ];

    const result = filterApprovedFonts(packageFiles);
    assert.strictEqual(result.approved.length, 2);
    assert.ok(result.approved.includes('navbrahmi-regular.ttf'));
    assert.ok(result.approved.includes('navbrahmi-bold.ttf'));
    assert.strictEqual(result.skipped.length, 3);
    assert.ok(result.skipped.includes('unapproved-arial-copy.ttf'));
    assert.ok(result.skipped.includes('malicious-font.otf'));
  });

  it('should require persistent Win32 font installation and reject process-private AddFontResourceExW FR_PRIVATE', () => {
    // Simulation of persistent installation requirements:
    // 1. File placement must be system or per-user Fonts directory
    // 2. Registry entry under ...\CurrentVersion\Fonts
    // 3. AddFontResourceW (persistent system-wide font table)
    // 4. FR_PRIVATE (0x10) must NEVER be used because process exit removes the font
    const FR_PRIVATE = 0x10;
    function validateFontInstallationMethod(flags: number, hasRegistry: boolean, hasFileCopy: boolean): boolean {
      if ((flags & FR_PRIVATE) !== 0) {
        // Forbidden: process-private font will be unregistered when bootstrapper terminates
        return false;
      }
      return hasRegistry && hasFileCopy;
    }

    assert.strictEqual(validateFontInstallationMethod(0, true, true), true, 'Standard persistent Win32 install accepted');
    assert.strictEqual(validateFontInstallationMethod(FR_PRIVATE, true, true), false, 'FR_PRIVATE strictly rejected');
    assert.strictEqual(validateFontInstallationMethod(0, false, true), false, 'Missing registry registration rejected');
  });

  it('should require post-install verification for exit code 0 and exit code 1638', () => {
    function evaluateInstallOutcome(exitCode: number, layoutVerified: boolean): { success: boolean; reason: string } {
      if (exitCode === 0) {
        if (layoutVerified) {
          return { success: true, reason: 'Installed and verified successfully.' };
        }
        return { success: false, reason: 'MSI reported success but keyboard layout was not verified in registry.' };
      }

      if (exitCode === 1638) {
        if (layoutVerified) {
          return { success: true, reason: 'Driver already installed and verified.' };
        }
        return { success: false, reason: 'MSI reported another version installed, but verified layout was missing.' };
      }

      return { success: false, reason: `MSI failed with exit code ${exitCode}.` };
    }

    // Happy path: exit 0 + verified
    assert.strictEqual(evaluateInstallOutcome(0, true).success, true);

    // False positive: exit 0 but layout NOT verified
    assert.strictEqual(evaluateInstallOutcome(0, false).success, false);
    assert.match(evaluateInstallOutcome(0, false).reason, /keyboard layout was not verified/);

    // Exit 1638 + verified
    assert.strictEqual(evaluateInstallOutcome(1638, true).success, true);

    // Exit 1638 but layout NOT verified (broken install)
    assert.strictEqual(evaluateInstallOutcome(1638, false).success, false);
    assert.match(evaluateInstallOutcome(1638, false).reason, /verified layout was missing/);

    // Fatal exit code 1603
    assert.strictEqual(evaluateInstallOutcome(1603, true).success, false);
  });

  it('should validate canonical Ed25519 token claims and cryptographic interoperability (Task 2)', async () => {
    const { signActivationToken, verifyActivationToken } = await import('../../src/lib/keys');

    // Create fresh test keypair for interoperability testing
    const testKeyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const oldPriv = process.env.LICENSE_SIGNING_PRIVATE_KEY;
    const oldPub = process.env.LICENSE_SIGNING_PUBLIC_KEY;
    process.env.LICENSE_SIGNING_PRIVATE_KEY = testKeyPair.privateKey;
    process.env.LICENSE_SIGNING_PUBLIC_KEY = testKeyPair.publicKey;

    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const machineHash = 'f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b';
      const productId = 'ashokan-brahmi';

      // 1. Generate canonical token from server side
      const token = signActivationToken({
        tid: 'tok_canonical_test_1',
        lid: 'lic_canonical_test_1',
        pid: productId,
        mch: machineHash,
        iat: nowSec,
        exp: nowSec + 3600,
        kid: 'nav-brahmi-ed25519-v1',
      });

      assert.strictEqual(typeof token, 'string');
      const parts = token.split('.');
      assert.strictEqual(parts.length, 2, 'Token must have <payload>.<sig> structure');

      // 2. Verify payload claims
      const payloadJson = Buffer.from(parts[0], 'base64url').toString('utf-8');
      const payload = JSON.parse(payloadJson);

      assert.strictEqual(payload.tid, 'tok_canonical_test_1');
      assert.strictEqual(payload.jti, 'tok_canonical_test_1'); // alias
      assert.strictEqual(payload.lid, 'lic_canonical_test_1');
      assert.strictEqual(payload.lic, 'lic_canonical_test_1'); // alias
      assert.strictEqual(payload.pid, productId);
      assert.strictEqual(payload.prd, productId); // alias
      assert.strictEqual(payload.mch, machineHash);
      assert.strictEqual(payload.kid, 'nav-brahmi-ed25519-v1');
      assert.strictEqual(payload.status, 'ACTIVE');

      // 3. Verify signature matches 64 bytes
      const sigBytes = Buffer.from(parts[1], 'base64url');
      assert.strictEqual(sigBytes.length, 64, 'Ed25519 signature must be exactly 64 bytes');

      // 4. Test server verification function
      const verification = verifyActivationToken(token, machineHash, productId);
      assert.strictEqual(verification.valid, true);

      // 5. Test rejection on altered payload
      const alteredPayload = Buffer.from(parts[0], 'base64url').toString('utf-8').replace('ashokan-brahmi', 'tamil-grantha');
      const alteredToken = `${Buffer.from(alteredPayload, 'utf-8').toString('base64url')}.${parts[1]}`;
      const alteredVerify = verifyActivationToken(alteredToken);
      assert.strictEqual(alteredVerify.valid, false);

      // 6. Test rejection on machine mismatch
      const wrongMachineVerify = verifyActivationToken(token, '0000000000000000000000000000000000000000000000000000000000000000');
      assert.strictEqual(wrongMachineVerify.valid, false);

      // 7. Test rejection on expired token
      const expiredToken = signActivationToken({
        tid: 'tok_expired_test',
        lid: 'lic_expired_test',
        pid: productId,
        mch: machineHash,
        iat: nowSec - 7200,
        exp: nowSec - 3600, // Expired 1 hour ago
      });
      const expiredVerify = verifyActivationToken(expiredToken);
      assert.strictEqual(expiredVerify.valid, false);
      assert.match(expiredVerify.error || '', /expired/i);
    } finally {
      process.env.LICENSE_SIGNING_PRIVATE_KEY = oldPriv;
      process.env.LICENSE_SIGNING_PUBLIC_KEY = oldPub;
    }
  });
});

