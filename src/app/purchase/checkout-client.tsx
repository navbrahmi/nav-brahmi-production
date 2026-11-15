'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface CheckoutProductProps {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
}

export function CheckoutClient({ product }: { product: CheckoutProductProps }) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'initiating' | 'awaiting_payment' | 'verifying' | 'cancelled' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [gatewayPendingNotice, setGatewayPendingNotice] = useState<string | null>(null);
  const [createdOrderToken, setCreatedOrderToken] = useState<string | null>(null);

  const priceInRupees = (product.priceMinor / 100).toFixed(2);

  // Preload Razorpay checkout script on mount so modal opens instantly
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // Dynamically load Razorpay checkout script if not present
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if (window.Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setGatewayPendingNotice(null);

    const emailTrimmed = customerEmail.trim();
    if (!emailTrimmed) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('initiating');

    try {
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName: customerName.trim(),
          customerEmail: emailTrimmed,
        }),
      });

      const data = await checkoutRes.json();

      if (!checkoutRes.ok) {
        setStatus('error');
        setErrorMessage(data?.error?.message || 'Failed to initialize order checkout.');
        return;
      }

      // Handle test payment bypass redirect immediately
      if (data.isTestBypass && data.orderToken) {
        setStatus('verifying');
        router.push(`/orders/${data.orderToken}`);
        return;
      }

      // Safe handling when gateway credentials are still being configured in test mode
      if (data.code === 'GATEWAY_CONFIG_PENDING' || !data.razorpayOrderId) {
        setStatus('idle');
        setGatewayPendingNotice(
          data.message ||
            'Razorpay payment gateway activation is in progress. Order has been recorded in system.'
        );
        setCreatedOrderToken(data.orderToken || null);
        return;
      }

      // Load SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setStatus('error');
        setErrorMessage(
          'Unable to load the Razorpay checkout script. Please check your network connection.'
        );
        return;
      }

      setStatus('awaiting_payment');

      const options = {
        key: data.keyId,
        amount: data.amountMinor,
        currency: data.currency,
        name: 'Nav Brahmi',
        description: `License Purchase: ${product.name}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: customerName.trim(),
          email: emailTrimmed,
        },
        theme: {
          color: '#E51055', // Official primary brand color
        },
        handler: async function (response: any) {
          setStatus('verifying');

          try {
            const verifyRes = await fetch('/api/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderToken: data.orderToken,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              router.push(`/orders/${data.orderToken}`);
            } else {
              setStatus('error');
              setErrorMessage(
                verifyData?.error?.message ||
                  'Payment was completed at gateway, but verification failed. Our team will reconcile this automatically.'
              );
            }
          } catch (err: any) {
            setStatus('error');
            setErrorMessage('Network error while verifying checkout signature.');
          }
        },
        modal: {
          ondismiss: function () {
            setStatus((prev) => (prev === 'error' ? 'error' : 'cancelled'));
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (failRes: any) {
        setStatus('error');
        setErrorMessage(
          failRes.error?.description || 'Payment was unsuccessful or declined by bank.'
        );
      });

      rzpInstance.open();
    } catch (err: any) {
      setStatus('error');
      setErrorMessage('Failed to connect to checkout service. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Order Summary Box */}
      <div
        className="card card-elevated"
        style={{ marginBottom: 'var(--space-xl)', border: '2px solid var(--border-subtle)' }}
      >
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-body)', marginBottom: '0.5rem' }}>
          {product.name}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          {product.description}
        </p>

        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              License Type: Lifetime Single-Machine Driver
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Taxes included • Instant activation
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand)' }}>
              ₹{priceInRupees}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.currency}</div>
          </div>
        </div>
      </div>

      {/* Gateway Pending Notice (Safe State) */}
      {gatewayPendingNotice && (
        <div
          className="card card-subtle"
          style={{
            marginBottom: 'var(--space-xl)',
            borderLeft: '4px solid var(--brand)',
            backgroundColor: '#FFF5F7',
          }}
          role="status"
        >
          <h3 style={{ fontSize: '1rem', color: 'var(--brand)', marginBottom: '0.35rem' }}>
            Payment Gateway Activation in Progress
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: '1.5', margin: 0 }}>
            {gatewayPendingNotice}
          </p>
          {createdOrderToken && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              Your order reference has been reserved:{' '}
              <Link
                href={`/orders/${createdOrderToken}`}
                style={{ color: 'var(--link)', fontWeight: 600, textDecoration: 'underline' }}
              >
                View Order Status ({createdOrderToken.substring(0, 10)}...)
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Enterprise Payment Verification Card */}
      {status === 'verifying' && (
        <div
          style={{
            marginBottom: 'var(--space-xl)',
            borderRadius: '12px',
            border: '1.5px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            padding: '1.75rem 1.5rem',
            boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            gap: '1.25rem',
            alignItems: 'center',
          }}
          role="status"
        >
          {/* Smooth Enterprise Spinner */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '3px solid rgba(229, 16, 85, 0.15)',
              borderTopColor: 'var(--brand)',
              animation: 'spin-smooth 0.85s linear infinite',
              flexShrink: 0,
            }}
          />

          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-body)', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Verifying Payment & Issuing License...
            </h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.45' }}>
              Confirming transaction signature and provisioning your software package. Please keep this window open...
            </p>
          </div>
        </div>
      )}

      {/* Payment Error / Failed Alert */}
      {errorMessage && (
        <div
          style={{
            marginBottom: 'var(--space-xl)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #FECACA',
            backgroundColor: '#FEF2F2',
            padding: '1.25rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.06)',
          }}
          role="alert"
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#991B1B', fontSize: '0.98rem', fontWeight: 700 }}>
              Payment Unsuccessful
            </h4>
            <p style={{ margin: '0 0 0.45rem 0', color: '#B91C1C', fontSize: '0.9rem', lineHeight: '1.4' }}>
              {errorMessage}
            </p>
            <p style={{ margin: 0, color: '#7F1D1D', fontSize: '0.825rem', opacity: 0.9 }}>
              No funds have been debited from your account. You can review your details and retry payment below, or choose another payment method (UPI, Card, or NetBanking).
            </p>
          </div>
        </div>
      )}

      {/* Cancelled / Dismissed State (Only shown if no explicit error occurred) */}
      {!errorMessage && status === 'cancelled' && (
        <div
          style={{
            marginBottom: 'var(--space-xl)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #FDE68A',
            backgroundColor: '#FFFBEB',
            padding: '1.25rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.06)',
          }}
          role="status"
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#92400E', fontSize: '0.98rem', fontWeight: 700 }}>
              Checkout Dismissed
            </h4>
            <p style={{ margin: 0, color: '#B45309', fontSize: '0.9rem', lineHeight: '1.45' }}>
              The payment window was closed before completing the purchase. No charges were made. You can resume and retry anytime using the button below.
            </p>
          </div>
        </div>
      )}

      {/* Customer Input & Pay Form */}
      <form onSubmit={handleCheckoutSubmit} className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-body)' }}>
          Customer Information
        </h3>

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="customerName"
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}
          >
            Full Name (Optional)
          </label>
          <input
            id="customerName"
            type="text"
            className="input-field"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            maxLength={100}
            disabled={status === 'initiating' || status === 'awaiting_payment' || status === 'verifying'}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="customerEmail"
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}
          >
            Email Address (Required for License Delivery) *
          </label>
          <input
            id="customerEmail"
            type="email"
            required
            className="input-field"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="e.g. yourname@example.com"
            disabled={status === 'initiating' || status === 'awaiting_payment' || status === 'verifying'}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
            Your official license key and installation instructions will be delivered to this email.
          </span>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === 'initiating' || status === 'awaiting_payment' || status === 'verifying'}
          style={{ width: '100%', fontSize: '1.05rem', padding: '0.85rem' }}
        >
          {status === 'initiating' && 'Connecting to Gateway...'}
          {status === 'awaiting_payment' && 'Awaiting Gateway Payment...'}
          {status === 'verifying' && 'Verifying Payment Signature...'}
          {(status === 'idle' || status === 'cancelled' || status === 'error') &&
            `Pay ₹${priceInRupees} with Razorpay`}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          🔒 Secure 256-bit encrypted checkout via Razorpay. Instant digital license delivery.
        </div>
      </form>
    </div>
  );
}
