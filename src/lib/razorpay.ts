import crypto from 'crypto';
import { logger } from './logger';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  isTestMode: boolean;
}

/**
 * Returns current Razorpay configuration.
 * Strictly enforces that live keys cannot be used during Phase 4 (TEST MODE ONLY).
 */
export function getRazorpayConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

  if (!keyId || !keySecret) {
    return null;
  }

  // Safety check: Phase 4 mandates TEST MODE only.
  if (keyId.startsWith('rzp_live_')) {
    logger.error('CRITICAL SAFETY VIOLATION: Live Razorpay key detected during Phase 4 test mode execution.');
    throw new Error('FATAL: Live Razorpay credentials are prohibited in Phase 4. Only TEST MODE keys (rzp_test_*) are permitted.');
  }

  return {
    keyId,
    keySecret,
    webhookSecret,
    isTestMode: keyId.startsWith('rzp_test_'),
  };
}

export function isRazorpayConfigured(): boolean {
  try {
    return getRazorpayConfig() !== null;
  } catch {
    return false;
  }
}

export interface CreateOrderParams {
  amountMinor: number; // in paise (e.g. 48000 for ₹480.00)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

/**
 * Creates a Razorpay Order server-side via official REST API.
 * Ref: https://razorpay.com/docs/api/orders/
 */
export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<RazorpayOrderResponse> {
  const config = getRazorpayConfig();
  if (!config) {
    throw new Error('Razorpay credentials are not configured in environment.');
  }

  const { amountMinor, currency = 'INR', receipt, notes = {} } = params;

  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error(`Invalid amountMinor: ${amountMinor}. Must be a positive integer in paise.`);
  }

  const authHeader = `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`;

  const payload = {
    amount: amountMinor,
    currency: currency.toUpperCase(),
    receipt,
    notes,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok) {
      const errDescription = data?.error?.description || data?.error?.code || 'Unknown Razorpay error';
      logger.error('Razorpay orders API call failed', {
        status: res.status,
        errorCode: data?.error?.code,
      });
      throw new Error(`Razorpay order creation failed: ${errDescription}`);
    }

    return data as RazorpayOrderResponse;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Razorpay orders API request timed out after 10 seconds.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Verifies Razorpay Checkout payment signature server-side.
 * Formula: HMAC-SHA256(order_id + "|" + payment_id, secret) == signature
 * Ref: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration#verify-payment-signature
 */
export function verifyCheckoutPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secretOverride?: string;
}): boolean {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, secretOverride } = params;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const secret = secretOverride || process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    logger.warn('Cannot verify checkout signature: RAZORPAY_KEY_SECRET is not configured.');
    return false;
  }

  try {
    const dataToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(dataToSign)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    const providedBuf = Buffer.from(razorpaySignature.trim(), 'utf8');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch (err: any) {
    logger.error('Error during checkout signature verification', { error: err.message });
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature using the raw body.
 * Formula: HMAC-SHA256(rawBody, webhookSecret) == X-Razorpay-Signature
 * Ref: https://razorpay.com/docs/webhooks/validate-test/
 */
export function verifyWebhookSignature(params: {
  rawBody: string;
  signature: string;
  secretOverride?: string;
}): boolean {
  const { rawBody, signature, secretOverride } = params;

  if (!rawBody || !signature) {
    return false;
  }

  const secret = secretOverride || process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    logger.warn('Cannot verify webhook signature: RAZORPAY_WEBHOOK_SECRET is not configured.');
    return false;
  }

  try {
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    const providedBuf = Buffer.from(signature.trim(), 'utf8');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch (err: any) {
    logger.error('Error during webhook signature verification', { error: err.message });
    return false;
  }
}
