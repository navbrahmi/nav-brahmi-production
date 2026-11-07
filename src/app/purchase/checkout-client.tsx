'use client';

import React, { useState } from 'react';
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
            setStatus('cancelled');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge badge-brand">Order Summary</span>
          <span className="badge badge-pending">TEST MODE</span>
        </div>

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
              Taxes included per client specification
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

      {/* Error Message */}
      {errorMessage && (
        <div
          className="card"
          style={{
            marginBottom: 'var(--space-xl)',
            borderLeft: '4px solid var(--state-error-text)',
            backgroundColor: 'var(--state-error-bg)',
          }}
          role="alert"
        >
          <div style={{ color: 'var(--state-error-text)', fontWeight: 600, fontSize: '0.95rem' }}>{errorMessage}</div>
        </div>
      )}

      {/* Cancelled State */}
      {status === 'cancelled' && (
        <div
          className="card card-subtle"
          style={{ marginBottom: 'var(--space-xl)', borderLeft: '4px solid var(--state-pending-border)' }}
          role="status"
        >
          <p style={{ margin: 0, color: 'var(--state-pending-text)', fontSize: '0.9rem' }}>
            Checkout was dismissed before completion. You can retry at any time using the button below.
          </p>
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
            `Pay ₹${priceInRupees} with Razorpay (TEST MODE)`}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          🔒 Payments processed via Razorpay Test Gateway. No live funds are charged during testing.
        </div>
      </form>
    </div>
  );
}
