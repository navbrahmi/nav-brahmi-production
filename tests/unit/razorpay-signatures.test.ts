import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import {
  verifyCheckoutPaymentSignature,
  verifyWebhookSignature,
} from '../../src/lib/razorpay';

describe('Razorpay Signature Verification (Timing-Safe Security Baseline)', () => {
  const testSecret = 'secret_test_xyz1234567890';
  const orderId = 'order_test_987654321';
  const paymentId = 'pay_test_123456789';

  it('should verify valid checkout payment signature', () => {
    // Expected signature formula: HMAC-SHA256(order_id + "|" + payment_id, secret)
    const dataToSign = `${orderId}|${paymentId}`;
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(dataToSign)
      .digest('hex');

    const result = verifyCheckoutPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
      secretOverride: testSecret,
    });

    assert.strictEqual(result, true);
  });

  it('should reject tampered checkout payment signature', () => {
    const dataToSign = `${orderId}|${paymentId}`;
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(dataToSign)
      .digest('hex');

    // Flip the last character
    const tampered = validSignature.slice(0, -1) + (validSignature.slice(-1) === 'a' ? 'b' : 'a');

    const result = verifyCheckoutPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: tampered,
      secretOverride: testSecret,
    });

    assert.strictEqual(result, false);
  });

  it('should reject checkout signature with mismatched payment ID or order ID', () => {
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const result = verifyCheckoutPaymentSignature({
      razorpayOrderId: 'order_different_999',
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
      secretOverride: testSecret,
    });

    assert.strictEqual(result, false);
  });

  it('should verify valid webhook signature calculated over raw request body', () => {
    const webhookSecret = 'whsec_testing_abcdef123456';
    const rawBody = JSON.stringify({
      entity: 'event',
      event: 'payment.captured',
      payload: { payment: { entity: { id: paymentId, amount: 48000 } } },
    });

    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const result = verifyWebhookSignature({
      rawBody,
      signature: validSignature,
      secretOverride: webhookSecret,
    });

    assert.strictEqual(result, true);
  });

  it('should reject webhook signature if raw body is tampered even by one character', () => {
    const webhookSecret = 'whsec_testing_abcdef123456';
    const rawBody = '{"entity":"event","event":"payment.captured"}';
    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Add trailing whitespace to raw body
    const tamperedBody = rawBody + ' ';

    const result = verifyWebhookSignature({
      rawBody: tamperedBody,
      signature: validSignature,
      secretOverride: webhookSecret,
    });

    assert.strictEqual(result, false);
  });

  it('should reject empty or missing signatures safely without crashing', () => {
    assert.strictEqual(
      verifyWebhookSignature({ rawBody: 'test', signature: '', secretOverride: 'secret' }),
      false
    );
    assert.strictEqual(
      verifyCheckoutPaymentSignature({
        razorpayOrderId: '',
        razorpayPaymentId: '',
        razorpaySignature: '',
        secretOverride: 'secret',
      }),
      false
    );
  });
});
