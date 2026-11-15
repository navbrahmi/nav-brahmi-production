'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface PortalLicenseItem {
  id: string;
  productName: string;
  licenseKey: string;
  orderToken?: string;
  createdAt: string;
}

export function RecoveryPortalClient({
  customerEmail,
  licenses,
}: {
  customerEmail: string;
  licenses: PortalLicenseItem[];
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleCopy = (id: string, key: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(key);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleDownloadInstaller = async (lic: PortalLicenseItem) => {
    if (!lic.orderToken) return;
    try {
      setDownloadingId(lic.id);
      const res = await fetch('/api/download-installer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderToken: lic.orderToken }),
      });

      if (!res.ok) {
        throw new Error('Download failed. Please try again.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Setup-${lic.productName.replace(/\s+/g, '')}.exe`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || 'Failed to download installer.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', paddingBottom: '3rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.5rem', fontSize: '1.9rem', fontWeight: 700 }}>
          Your Purchased Software Licenses
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0 }}>
          Showing all official licenses registered to <strong>{customerEmail}</strong>
        </p>
      </header>

      {licenses.length === 0 ? (
        <div className="card card-elevated" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-body)', marginBottom: '0.75rem' }}>
            No Active Licenses Found
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            There are currently no active licenses associated with this email address. If you believe this is an error, please reach out to our support team.
          </p>
          <Link href="/contact" className="btn btn-primary">
            Contact Support Team
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {licenses.map((lic) => (
            <div
              key={lic.id}
              className="card card-elevated"
              style={{
                borderRadius: '16px',
                border: '1.5px solid var(--border-subtle)',
                padding: '1.75rem',
                backgroundColor: 'var(--surface)',
                boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Software Package
                  </div>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--text-body)', margin: '0.2rem 0 0.35rem', fontWeight: 700 }}>
                    {lic.productName}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Purchased on {new Date(lic.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {lic.orderToken && (
                      <span> • Ref: <code style={{ fontSize: '0.85rem' }}>{lic.orderToken.substring(0, 10)}...</code></span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    ● Lifetime License (1 Machine)
                  </span>
                </div>
              </div>

              {/* License Key Box */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Official Product License Key
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(lic.id, lic.licenseKey)}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }}
                  >
                    {copiedId === lic.id ? '✓ Copied' : 'Copy Key'}
                  </button>
                </div>
                <code
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--brand)',
                    display: 'block',
                    wordBreak: 'break-all',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {lic.licenseKey}
                </code>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {lic.orderToken && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownloadInstaller(lic)}
                      disabled={downloadingId === lic.id}
                      className="btn btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        padding: '0.65rem 1.25rem',
                        fontWeight: 600,
                      }}
                    >
                      <span>{downloadingId === lic.id ? 'Preparing...' : '⬇ Download Setup.exe'}</span>
                    </button>

                    <a
                      href={`/api/orders/${encodeURIComponent(lic.orderToken)}/invoice`}
                      download
                      className="btn btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        padding: '0.65rem 1.15rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <span>📄 Download Tax Invoice (PDF)</span>
                    </a>

                    <Link
                      href={`/orders/${encodeURIComponent(lic.orderToken)}`}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.9rem', padding: '0.65rem 1rem' }}
                    >
                      Order Details →
                    </Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Support footer card */}
      <div className="card card-subtle" style={{ textAlign: 'center', marginTop: '2.5rem', borderRadius: '14px', padding: '1.5rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
          Need assistance or replacing hardware? Contact our engineering support at{' '}
          <a href="mailto:support@brahmicomputing.in" style={{ color: 'var(--brand)', fontWeight: 600 }}>
            support@brahmicomputing.in
          </a>{' '}
          or call <strong>+91 98459 80534</strong>.
        </p>
      </div>
    </div>
  );
}

