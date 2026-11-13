/**
 * Payment Bypass Helper for Local Testing and Staging
 * 
 * Safety constraints:
 * - Fails closed in production: strictly returns false if NODE_ENV === 'production'.
 * - Active only when DEMO_PAYMENT_BYPASS=true in development/test.
 */
export function isPaymentBypassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.DEMO_PAYMENT_BYPASS === 'true';
}

