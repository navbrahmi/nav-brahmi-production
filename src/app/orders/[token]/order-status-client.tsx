'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export interface OrderStatusProps {
  publicToken: string;
  initialStatus: string;
  productName: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  createdAt: string;
  hasLicense: boolean;
}

export function OrderStatusClient({ initialData }: { initialData: OrderStatusProps }) {
  const [data, setData] = useState<OrderStatusProps>(initialData);
  const [isPolling, setIsPolling] = useState(
    initialData.initialStatus === 'CREATED' ||
      initialData.initialStatus === 'PAYMENT_PENDING' ||
      initialData.initialStatus === 'PAID'
  );

  useEffect(() => {
    if (!isPolling) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/status?token=${encodeURIComponent(data.publicToken)}`);
        if (res.ok) {
          const body = await res.json();
          if (body?.order) {
            setData((prev) => ({
              ...prev,
              initialStatus: body.order.status,
              hasLicense: body.order.hasLicense,
            }));

            // Stop polling once terminal or delivered
            if (
              body.order.status === 'LICENSE_ISSUED' ||
              body.order.status === 'DELIVERED' ||
              body.order.status === 'FAILED' ||
              body.order.status === 'EXPIRED' ||
              body.order.status === 'PAYMENT_MISMATCH'
            ) {
              setIsPolling(false);
            }
          }
        }
      } catch {
        // Silent poll error; will retry on next interval
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [isPolling, data.publicToken]);

  const priceFormatted = (data.amountMinor / 100).toFixed(2);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'LICENSE_ISSUED':
        return <span className="badge badge-brand">✓ License Issued & Delivered</span>;
      case 'PAID':
        return <span className="badge badge-brand">Payment Verified • Generating License</span>;
      case 'PAYMENT_PENDING':
        return <span className="badge badge-pending">Payment Pending</span>;
      case 'CREATED':
        return <span className="badge badge-pending">Order Created</span>;
      case 'FAILED':
      case 'EXPIRED':
        return <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>Payment Not Completed</span>;
      case 'PAYMENT_MISMATCH':
      case 'NEEDS_ATTENTION':
        return <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>Under Verification</span>;
      default:
        return <span className="badge badge-subtle">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="card card-elevated" style={{ marginBottom: 'var(--space-xl)', border: '2px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Order Reference
            </div>
            <code style={{ fontSize: '0.95rem', fontWeight: 600 }}>{data.publicToken}</code>
          </div>
          <div>{getStatusBadge(data.initialStatus)}</div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--text-body)', marginBottom: '0.35rem' }}>
            {data.productName}
          </h2>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Recipient Email: <strong>{data.customerEmail}</strong>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Total Paid: <strong>₹{priceFormatted} {data.currency}</strong>
          </div>
        </div>

        {/* Dynamic Action Area */}
        {(data.initialStatus === 'LICENSE_ISSUED' || data.initialStatus === 'DELIVERED') && (
          <div
            style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '6px',
              padding: '1.25rem',
              marginTop: '1.25rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', color: '#166534', margin: '0 0 0.5rem' }}>
              Your License Has Been Issued!
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#14532D', margin: '0 0 1rem', lineHeight: '1.5' }}>
              An email containing your official license key and secure software download link has been
              dispatched to <strong>{data.customerEmail}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/instructions" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
                View Installation Guide
              </Link>
              <Link href="/faq" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
                Help & FAQ
              </Link>
            </div>
          </div>
        )}

        {(data.initialStatus === 'CREATED' || data.initialStatus === 'PAYMENT_PENDING') && (
          <div
            style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '6px',
              padding: '1.25rem',
              marginTop: '1.25rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', color: '#92400E', margin: '0 0 0.5rem' }}>
              Awaiting Payment Confirmation
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#78350F', margin: 0, lineHeight: '1.5' }}>
              This page automatically checks for payment confirmation from Razorpay every few seconds.
              Once your payment is verified, your license key will be issued immediately.
            </p>
          </div>
        )}

        {data.initialStatus === 'PAID' && (
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '6px',
              padding: '1.25rem',
              marginTop: '1.25rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', color: '#1E40AF', margin: '0 0 0.5rem' }}>
              Payment Verified
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#1E3A8A', margin: 0, lineHeight: '1.5' }}>
              Your payment has been successfully captured. The cryptographic license generation pipeline
              is currently processing your activation key...
            </p>
          </div>
        )}
      </div>

      <div className="card card-subtle" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
          Need assistance with this order? Contact our support team at{' '}
          <a href="mailto:support@brahmicomputing.in" style={{ color: 'var(--link)', textDecoration: 'underline' }}>
            support@brahmicomputing.in
          </a>{' '}
          with reference <code>{data.publicToken.substring(0, 12)}...</code>
        </p>
      </div>
    </div>
  );
}
