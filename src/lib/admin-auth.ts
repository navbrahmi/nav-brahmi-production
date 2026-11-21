import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'nb_admin_session';
const SESSION_DURATION_HOURS = 24;

function getSecretKey(): Buffer {
  const secret = process.env.LICENSE_TOKEN_SECRET || process.env.ADMIN_SECRET || 'nav-brahmi-production-admin-session-secret-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Validates the admin credentials.
 * Supports configurable ADMIN_PASSWORD in environment (default: NavBrahmi@Admin2026).
 */
export function verifyAdminCredentials(username?: string, password?: string): boolean {
  if (!username || !password) return false;

  const expectedUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'NavBrahmi@Admin2026').trim();

  const userMatch = username.trim().toLowerCase() === expectedUsername;

  // Constant-time password comparison to prevent timing attacks
  const passBuf = Buffer.from(password.trim(), 'utf8');
  const expectedBuf = Buffer.from(expectedPassword, 'utf8');

  let passMatch = false;
  if (passBuf.length === expectedBuf.length) {
    passMatch = crypto.timingSafeEqual(passBuf, expectedBuf);
  }

  return userMatch && passMatch;
}

/**
 * Creates a signed admin session token: base64url(payload).base64url(hmac)
 */
export function createAdminSessionToken(username = 'admin'): string {
  const exp = Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000;
  const payloadObj = {
    u: username,
    exp,
    iat: Date.now(),
    role: 'ADMIN',
  };

  const payloadStr = JSON.stringify(payloadObj);
  const payloadB64 = Buffer.from(payloadStr).toString('base64url');

  const key = getSecretKey();
  const signature = crypto.createHmac('sha256', key).update(payloadB64).digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed admin session token.
 */
export function verifyAdminSessionToken(token?: string | null): { valid: boolean; username?: string } {
  if (!token || !token.includes('.')) {
    return { valid: false };
  }

  const [payloadB64, providedSig] = token.split('.');
  if (!payloadB64 || !providedSig) {
    return { valid: false };
  }

  try {
    const key = getSecretKey();
    const expectedSig = crypto.createHmac('sha256', key).update(payloadB64).digest('base64url');

    const expectedBuf = Buffer.from(expectedSig);
    const providedBuf = Buffer.from(providedSig);

    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      return { valid: false };
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return { valid: false }; // Expired
    }

    return { valid: true, username: payload.u };
  } catch {
    return { valid: false };
  }
}

/**
 * Checks if the current request has a valid admin session cookie.
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const result = verifyAdminSessionToken(token);
    return result.valid;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };

