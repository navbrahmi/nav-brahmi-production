import crypto from 'crypto';

/**
 * Public Verification Key (Safe to embed in client / bootstrapper)
 * Used ONLY for verifying Ed25519 signatures on activation tokens.
 */
export function getVerificationPublicKey(): string {
  const envKey = process.env.LICENSE_SIGNING_PUBLIC_KEY;
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim().replace(/\\n/g, '\n');
  }
  // In development / non-production, allow a defined development key
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_PUBLIC_KEY_PEM) {
    return process.env.DEV_PUBLIC_KEY_PEM.trim().replace(/\\n/g, '\n');
  }
  throw new Error('FATAL: LICENSE_SIGNING_PUBLIC_KEY environment variable is missing.');
}

/**
 * Server-Side Private Signing Key (NEVER exposed to client/browser/API)
 * Used by the backend to sign activation tokens.
 */
export function getSigningPrivateKey(): string {
  const privateKey = process.env.LICENSE_SIGNING_PRIVATE_KEY;
  if (!privateKey || privateKey.trim().length === 0) {
    throw new Error('FATAL: LICENSE_SIGNING_PRIVATE_KEY environment variable is missing.');
  }
  return privateKey.trim().replace(/\\n/g, '\n');
}

export interface ActivationTokenPayload {
  // Canonical claims (Mandatory per Task 2 specification)
  tid?: string; // Token ID (UUID)
  lid?: string; // License ID
  pid?: string; // Product Code / ID
  mch?: string; // Machine hash (SHA-256)
  iat?: number; // Issued-at Unix timestamp (seconds)
  exp?: number; // Expiry Unix timestamp (seconds)
  kid?: string; // Key ID for rotation

  // Standard JWT / Legacy compatibility aliases
  jti?: string;
  lic?: string;
  prd?: string;
  license_id?: string;
  license_key?: string;
  product_code?: string;
  machine_id?: string;
  status?: string;
  issued_at?: number;
  expires_at?: number;
}

export const CURRENT_KEY_ID = process.env.LICENSE_SIGNING_KEY_ID || 'nav-brahmi-ed25519-v1';

/**
 * Signs an activation token using the server-side Ed25519 private key.
 * Output format: <base64url_payload>.<base64url_signature>
 * 
 * Cryptographic protocol:
 * - Payload: UTF-8 JSON object containing canonical claims (tid, lid, pid, mch, iat, exp, kid)
 * - Signed Bytes: UTF-8 bytes of <base64url_payload>
 * - Signature: Raw 64-byte Ed25519 signature encoded as base64url
 */
export function signActivationToken(input: ActivationTokenPayload): string {
  const privateKey = getSigningPrivateKey();

  const nowSec = Math.floor(Date.now() / 1000);
  const tid = input.tid || input.jti || crypto.randomUUID();
  const lid = input.lid || input.lic || input.license_id || '';
  const pid = input.pid || input.prd || input.product_code || '';
  const mch = input.mch || input.machine_id || '';
  const iat = input.iat || input.issued_at || nowSec;
  const exp = input.exp || input.expires_at || (nowSec + 3600); // Default 1 hour download validity
  const kid = input.kid || CURRENT_KEY_ID;

  const payload: ActivationTokenPayload = {
    // Canonical claims
    tid,
    lid,
    pid,
    mch,
    iat,
    exp,
    kid,

    // Aliases to guarantee 100% interoperability across all consumers
    jti: tid,
    lic: lid,
    prd: pid,
    license_id: lid,
    product_code: pid,
    machine_id: mch,
    issued_at: iat,
    expires_at: exp,
    status: input.status || 'ACTIVE',
    ...(input.license_key ? { license_key: input.license_key } : {}),
  };

  const jsonStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(jsonStr, 'utf-8').toString('base64url');

  const signature = crypto.sign(null, Buffer.from(payloadB64, 'utf-8'), privateKey);
  const signatureB64 = signature.toString('base64url');

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies an activation token using the public verification key.
 */
export function verifyActivationToken(
  token: string,
  expectedMachineId?: string,
  expectedProductId?: string
): { valid: boolean; payload?: ActivationTokenPayload; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Activation token is missing or invalid.' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token structure. Expected <payload>.<signature>' };
  }

  const [payloadB64, signatureB64] = parts;

  try {
    const signature = Buffer.from(signatureB64, 'base64url');
    if (signature.length !== 64) {
      return { valid: false, error: 'Invalid Ed25519 signature length (expected 64 bytes).' };
    }

    const publicKey = getVerificationPublicKey();
    const isValidSignature = crypto.verify(
      null,
      Buffer.from(payloadB64, 'utf-8'),
      publicKey,
      signature
    );

    if (!isValidSignature) {
      return { valid: false, error: 'Cryptographic signature verification failed.' };
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload: ActivationTokenPayload = JSON.parse(payloadJson);

    // Verify key rotation / key ID
    if (payload.kid && payload.kid !== CURRENT_KEY_ID && payload.kid !== 'nav-brahmi-ed25519-v1') {
      return { valid: false, error: `Unknown or unapproved key ID: ${payload.kid}.`, payload };
    }

    // Verify token status
    if (payload.status && payload.status !== 'ACTIVE') {
      return { valid: false, error: `Token status is not active (status: ${payload.status}).`, payload };
    }

    // Verify expiration claim
    const nowSec = Math.floor(Date.now() / 1000);
    const effectiveExpiry = payload.exp || payload.expires_at;
    if (effectiveExpiry && effectiveExpiry < nowSec) {
      return { valid: false, error: 'Activation token has expired.', payload };
    }

    // Verify machine binding if expectedMachineId provided
    const tokenMachine = payload.mch || payload.machine_id;
    if (expectedMachineId && tokenMachine && tokenMachine.toLowerCase() !== expectedMachineId.toLowerCase()) {
      return {
        valid: false,
        error: `Machine ID mismatch (bound to ${tokenMachine.substring(0, 8)}..., requested ${expectedMachineId.substring(0, 8)}...).`,
        payload,
      };
    }

    // Verify product match if expectedProductId provided
    const tokenProduct = payload.pid || payload.prd || payload.product_code;
    if (expectedProductId && tokenProduct && tokenProduct.toLowerCase() !== expectedProductId.toLowerCase()) {
      return {
        valid: false,
        error: `Product mismatch (token for ${tokenProduct}, requested ${expectedProductId}).`,
        payload,
      };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: `Token verification error: ${err.message}` };
  }
}

