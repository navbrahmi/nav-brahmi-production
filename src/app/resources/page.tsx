import React from 'react';
import Link from 'next/link';
import { resourcesContent } from '../../content/resources';

export const metadata = {
  title: 'Fonts & Script Resources — Unicode Typography & Licenses',
  description:
    'Guidance on Unicode typography, font licenses, and keyboard resources for Indian language computing with Nav Brahmi.',
};

export default function ResourcesPage() {
  return (
    <div className="container container-reading">
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-brand">Typography & Assets</span>
          <span className="badge badge-pending">License Verification</span>
        </div>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          {resourcesContent.title}
        </h1>
        <p className="hero-lead">
          {resourcesContent.subtitle}
        </p>
      </header>

      {/* Compliance & IP Warning */}
      <section className="card card-subtle" style={{ borderLeft: '4px solid var(--brand)', marginBottom: 'var(--space-2xl)' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-body)', marginBottom: '0.5rem' }}>
          Font Licensing & Intellectual Property Notice (C-29)
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-body)', lineHeight: '1.6', margin: 0 }}>
          {resourcesContent.complianceNotice}
        </p>
      </section>

      {/* Resource Inventory */}
      <section aria-labelledby="resources-list-heading" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 id="resources-list-heading" style={{ marginBottom: 'var(--space-lg)' }}>
          Supported Font Families & Resources
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {resourcesContent.resources.map((item, idx) => (
            <div key={idx} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-body)', margin: 0 }}>
                  {item.name}
                </h3>
                <span className="badge badge-brand">{item.category}</span>
              </div>
              <p style={{ color: 'var(--text-body)', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                {item.description}
              </p>
              <div style={{ background: 'var(--surface-subtle)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Licence:</strong> {item.licenseStatus} • <em>{item.notes}</em>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Placeholder Notice */}
      <div className="placeholder-notice" role="note" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div>
          <strong>External Links Status:</strong> {resourcesContent.missingLinksNotice}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/instructions" className="btn btn-primary" style={{ marginRight: '1rem' }}>
          View Installation Guide →
        </Link>
        <Link href="/products" className="btn btn-secondary">
          Browse Keyboard Drivers
        </Link>
      </div>
    </div>
  );
}
