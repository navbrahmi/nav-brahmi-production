'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface RecoveredLicense {
  license_id: string;
  license_key: string;
  product_name: string;
  product_id: string;
  activation_status: string;
  created_at: string;
  download_url: string;
}

export default function LicenseRecoveryPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [licenses, setLicenses] = useState<RecoveredLicense[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLicenses([]);

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your purchase email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/license/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'No active licenses were found for this email address.');
        setIsLoading(false);
        return;
      }

      setLicenses(data.licenses || []);
    } catch (err) {
      console.error(err);
      setErrorMessage('A network connection error occurred while recovering your license.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="container container-reading">
      <div className="card card-elevated">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <span className="badge badge-brand">Customer Support</span>
          <span className="badge badge-pending">Self-Service Recovery</span>
        </div>

        <h1 style={{ color: 'var(--brand)', marginBottom: '0.5rem' }}>
          License & Installer Recovery
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
          Retrieve your registered Nav Brahmi licenses and access authorized Windows installers at any time using your purchase email address.
        </p>

        {/* Email Lookup Card */}
        <div
          style={{
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.75rem',
            marginBottom: '2rem',
          }}
        >
          <form onSubmit={handleRecover}>
            <div className="form-group">
              <label className="form-label" htmlFor="recovery-email">
                Purchase Email Address <span style={{ color: 'var(--brand)' }}>*</span>
              </label>
              <input
                id="recovery-email"
                type="email"
                className="form-input"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {errorMessage && (
              <div
                role="alert"
                style={{
                  background: 'var(--state-error-bg)',
                  color: 'var(--state-error-text)',
                  border: '1px solid var(--state-error-border)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                ⚠️ {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.95rem' }}
              disabled={isLoading}
            >
              {isLoading ? 'Searching Registered Licenses…' : 'Locate My License & Installer'}
            </button>
          </form>
        </div>

        {/* Recovered Licenses Results */}
        {licenses.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', color: 'var(--text-body)' }}>
              Found {licenses.length} Active {licenses.length === 1 ? 'License' : 'Licenses'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {licenses.map((lic) => (
                <div
                  key={lic.license_id}
                  style={{
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.75rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-body)' }}>
                          {lic.product_name}
                        </h3>
                        <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>
                          Active
                        </span>
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        Registered on {new Date(lic.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <a
                      href={lic.download_url}
                      className="btn btn-primary"
                      style={{
                        padding: '0.75rem 1.4rem',
                        fontSize: '0.95rem',
                      }}
                    >
                      <span>📥 Download Setup Package</span>
                    </a>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: 700 }}>
                      License Key
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--surface-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <code style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>
                        {lic.license_key}
                      </code>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleCopy(lic.license_key)}
                      >
                        {copiedKey === lic.license_key ? '✓ Copied' : 'Copy Key'}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '1.25rem',
                      padding: '0.85rem 1rem',
                      background: 'rgba(229, 16, 85, 0.05)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(229, 16, 85, 0.2)',
                      fontSize: '0.85rem',
                      color: 'var(--text-body)',
                    }}
                  >
                    💡 <strong>Installation Note:</strong> Run the downloaded installer package with administrative rights on your Windows machine to complete setup.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <Link href="/products" className="btn btn-secondary">
            ← Explore Products Catalog
          </Link>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Questions regarding your license?{' '}
            <Link href="/contact" style={{ fontWeight: 600 }}>
              Contact Support →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
