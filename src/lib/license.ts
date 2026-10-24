import crypto from 'crypto';

/**
 * Validates standard email address format.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed) && trimmed.length <= 254;
}

/**
 * Generates a cryptographically secure, unpredictable, and distinct license key.
 * Format: NAV-XXXX-XXXX-XXXX-XXXX
 */
export function generateSecureLicenseKey(): string {
  const chunk1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const chunk2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const chunk3 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const chunk4 = crypto.randomBytes(2).toString('hex').toUpperCase();

  return `NAV-${chunk1}-${chunk2}-${chunk3}-${chunk4}`;
}

/**
 * Resolves the secret for short-lived tokens and installer HMAC signatures.
 * Strictly requires LICENSE_TOKEN_SECRET without falling back to Ed25519 private keys.
 */
export function getLicenseTokenSecret(): string {
  const secret = process.env.LICENSE_TOKEN_SECRET;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      return 'dev-license-token-secret-fallback-32b-local';
    }
    throw new Error('FATAL: LICENSE_TOKEN_SECRET environment variable is missing.');
  }
  return secret.trim();
}

export interface PurchaseAuthPayload {
  license_id: string;
  license_key: string;
  email: string;
  issued_at: number;
  expires_at: number;
}

/**
 * Creates a short-lived cryptographically signed purchase authorization token.
 */
export function createPurchaseAuthToken(
  licenseKey: string,
  licenseId: string,
  email: string,
  expiresInHours = 72
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: PurchaseAuthPayload = {
    license_id: licenseId,
    license_key: licenseKey,
    email: email.toLowerCase(),
    issued_at: now,
    expires_at: now + expiresInHours * 3600,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getLicenseTokenSecret())
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies a purchase authorization token and extracts the license details.
 */
export function verifyPurchaseAuthToken(token: string): {
  valid: boolean;
  payload?: PurchaseAuthPayload;
  error?: string;
} {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is empty or invalid.' };
    }

    const parts = token.trim().split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Malformed token structure.' };
    }

    const [payloadBase64, providedSig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', getLicenseTokenSecret())
      .update(payloadBase64)
      .digest('base64url');

    const expectedBuffer = Buffer.from(expectedSig);
    const providedBuffer = Buffer.from(providedSig);

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return { valid: false, error: 'Invalid token signature.' };
    }

    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: PurchaseAuthPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.expires_at && now > payload.expires_at) {
      return { valid: false, error: 'Purchase authorization token has expired.' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: `Failed to verify token: ${err.message}` };
  }
}

/**
 * Creates an HMAC-SHA256 signature for the installer payload embedded in Setup.exe.
 */
export function createInstallerPayloadSignature(
  backendUrl: string,
  licenseKey: string = '',
  token: string = '',
  generatedAt: number | string = ''
): string {
  const secret = getLicenseTokenSecret();
  const dataToSign = `${backendUrl}|${licenseKey}|${token}|${generatedAt}`;
  return crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
}

/**
 * Verifies the HMAC-SHA256 signature of an embedded installer payload.
 */
export function verifyInstallerPayloadSignature(
  backendUrl: string,
  licenseKey: string = '',
  token: string = '',
  generatedAt: number | string = '',
  signature: string = ''
): boolean {
  if (!signature || typeof signature !== 'string') return false;
  try {
    const expected = createInstallerPayloadSignature(backendUrl, licenseKey, token, generatedAt);
    const bufExpected = Buffer.from(expected, 'hex');
    const bufProvided = Buffer.from(signature, 'hex');
    if (bufExpected.length !== bufProvided.length) return false;
    return crypto.timingSafeEqual(bufExpected, bufProvided);
  } catch {
    return false;
  }
}

/**
 * Resolves the canonical backend URL for Setup.exe downloads.
 * In production: strictly enforces https:// and rejects localhost/loopback.
 * In development: allows localhost/127.0.0.1.
 */
export function getInstallerBackendUrl(
  hostHeader?: string | null,
  nextUrlHost?: string | null
): string {
  const isProd = process.env.NODE_ENV === 'production';
  const host = (hostHeader || nextUrlHost || '').toLowerCase();

  // Allow local development origins only in non-production
  if (!isProd && (host.startsWith('localhost') || host.startsWith('127.0.0.1'))) {
    return `http://${host}`;
  }

  const appUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('FATAL: APP_BASE_URL must be configured.');
  }

  const trimmed = appUrl.trim().replace(/\/+$/, '');
  if (isProd) {
    if (!trimmed.startsWith('https://')) {
      throw new Error(`FATAL: In production, APP_BASE_URL must use https://. Received: "${trimmed}"`);
    }
    if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
      throw new Error('FATAL: In production, APP_BASE_URL cannot point to localhost or loopback.');
    }
  }

  return trimmed;
}
