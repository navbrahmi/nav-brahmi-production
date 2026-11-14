import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { productCategories } from '../../../content/categories';
import { prisma } from '../../../lib/prisma';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return productCategories.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = productCategories.find((c) => c.slug === slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.agreementName} Keyboard Driver`,
    description: `Official Nav Brahmi Windows keyboard layout driver and Unicode typography for ${category.agreementName} (${category.scriptName} script).`,
    openGraph: {
      title: `${category.agreementName} — Nav Brahmi`,
      description: `Native Windows keyboard layout driver and authentic Unicode typography for ${category.agreementName}.`,
    },
  };
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const category = productCategories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  // Attempt to read price from database
  let dbProduct: { priceMinor: number | null; price: number } | null = null;
  try {
    dbProduct = await prisma.product.findFirst({
      where: { slug: category.slug },
      select: { priceMinor: true, price: true },
    });
  } catch (err) {
    dbProduct = null;
  }

  const hasConfirmedPrice =
    dbProduct?.priceMinor !== null &&
    dbProduct?.priceMinor !== undefined &&
    dbProduct.priceMinor > 0;

  return (
    <div className="container container-reading">
      {/* Navigation Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
        <Link href="/products" style={{ color: 'var(--link)', textDecoration: 'none' }}>
          ← Back to All Products
        </Link>
      </nav>

      {/* Script-First Specimen Box */}
      <div className="script-specimen-box">
        <div style={{ marginBottom: 'var(--space-xs)' }}>
          <span className="script-specimen-tag" lang={category.bcp47Tag}>
            BCP-47: {category.bcp47Tag} • ISO 15924: {category.iso15924}
          </span>
        </div>
        <div className={`script-specimen-large font-script-${category.slug}`} lang={category.bcp47Tag} data-script={category.iso15924} aria-label={`${category.scriptName} Script Specimen`}>
          {category.specimenGlyphs}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Authentic script specimen from official Nav Brahmi materials
        </div>
      </div>

      {/* Header and Title */}
      <header style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          {category.agreementName}
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {category.overview}
        </p>
      </header>

      {/* Technical Features */}
      <section className="card" style={{ marginBottom: 'var(--space-xl)' }} aria-labelledby="features-heading">
        <h2 id="features-heading" style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--text-body)' }}>
          Keyboard Layout Features
        </h2>
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '1rem' }}>
          {category.features.map((feature, idx) => (
            <li key={idx} style={{ lineHeight: '1.6' }}>
              {feature}
            </li>
          ))}
        </ul>
      </section>

      {/* Technical Specifications */}
      <section className="card" style={{ marginBottom: 'var(--space-xl)' }} aria-labelledby="specs-heading">
        <h2 id="specs-heading" style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--text-body)' }}>
          System Specifications & Delivery
        </h2>
        <div className="table-wrap">
          <table className="data-table">
            <tbody>
              <tr>
                <th style={{ width: '38%' }}>Supported OS</th>
                <td>{category.specifications.supportedWindows}</td>
              </tr>
              <tr>
                <th>Delivered Builds</th>
                <td>
                  <code style={{ fontSize: '0.85rem', background: 'var(--surface-subtle)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                    {category.specifications.architecturesDelivered.join(', ')}
                  </code>
                </td>
              </tr>
              <tr>
                <th>Input Method</th>
                <td>{category.specifications.inputMethod}</td>
              </tr>
              <tr>
                <th>Character Encoding</th>
                <td>{category.specifications.encoding}</td>
              </tr>
              <tr>
                <th>Language Switcher</th>
                <td>
                  <strong>{category.specifications.shortcut}</strong>
                </td>
              </tr>
              <tr>
                <th>Default Indic Font</th>
                <td>
                  <strong>{category.defaultFont}</strong> (TrueType)
                </td>
              </tr>
              <tr>
                <th>Included Assets</th>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {category.manuals && category.manuals.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                        {category.manuals.map((m, idx) => (
                          <a
                            key={idx}
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--brand)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <span>📄</span> {m.filename}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span>{category.manualAsset}</span>
                    )}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      • {category.stickerAsset}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Keyboard Layout Screenshots */}
      {category.images && category.images.length > 0 && (
        <section className="card" style={{ marginBottom: 'var(--space-2xl)' }} aria-labelledby="screenshots-heading">
          <h2 id="screenshots-heading" style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: 'var(--text-body)' }}>
            Keyboard Layout & Interface
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Official Microsoft Windows keyboard layout and character mapping for {category.agreementName}.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {category.images.map((imgSrc, idx) => (
              <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--surface-subtle)' }}>
                <Image
                  src={imgSrc}
                  alt={`${category.agreementName} Keyboard Layout ${category.images.length > 1 ? `(${idx + 1})` : ''}`}
                  width={2172}
                  height={1013}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Official Documentation & User Manual */}
      {category.manuals && category.manuals.length > 0 && (
        <section className="card card-subtle" style={{ marginBottom: 'var(--space-2xl)' }} aria-labelledby="manuals-heading">
          <div style={{ marginBottom: '1rem' }}>
            <h2 id="manuals-heading" style={{ fontSize: '1.35rem', color: 'var(--text-body)', margin: '0 0 0.35rem 0' }}>
              Official User Manual & Documentation
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
              Complete typing instructions, character mappings, and layout guides for {category.agreementName}.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1rem' }}>
            {category.manuals.map((manual, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  padding: '1rem 1.25rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'rgba(229, 16, 85, 0.08)',
                      color: 'var(--brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-body)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {manual.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      PDF Document • {manual.size}
                    </div>
                  </div>
                </div>

                <a
                  href={manual.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                  download
                >
                  Download PDF
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Interactive Typing Demonstration & Font Preview */}
      <section className="card" style={{ marginBottom: 'var(--space-xl)' }} aria-labelledby="typing-demo-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h2 id="typing-demo-heading" style={{ fontSize: '1.4rem', color: 'var(--text-body)', margin: 0 }}>
            Typing Demonstration & Font Preview
          </h2>
          <span className="badge badge-brand" style={{ fontSize: '0.8rem' }}>
            {category.defaultFont}
          </span>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Rendered using the verified <strong>{category.defaultFont}</strong> font file. The Nav Brahmi keyboard layout produces native Unicode text for {category.scriptName} across all Windows text editors and web browsers.
        </p>

        <div
          style={{
            background: 'var(--surface-subtle)',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-lg)',
          }}
        >
          <label
            htmlFor="typing-demo-input"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}
          >
            Interactive Typing Box ({category.scriptName})
          </label>
          <input
            id="typing-demo-input"
            type="text"
            defaultValue={category.specimenGlyphs}
            className={`input-field font-script-${category.slug}`}
            lang={category.bcp47Tag}
            data-script={category.iso15924}
            aria-label={`Interactive typing demonstration for ${category.scriptName}`}
            placeholder={`Type in ${category.scriptName}...`}
            style={{
              fontSize: '1.5rem',
              color: 'var(--brand)',
              padding: '0.75rem 1rem',
              width: '100%',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)',
              background: 'var(--surface)',
            }}
          />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Tip: Press <strong>{category.specifications.shortcut}</strong> in Windows to activate {category.agreementName} after installation.
          </div>
        </div>
      </section>

      {/* Purchase Entry Section */}
      <section className="card card-elevated" aria-labelledby="purchase-heading" style={{ border: '2px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-brand">Purchase & Licensing</span>
        </div>
        <h2 id="purchase-heading" style={{ color: 'var(--brand)', marginBottom: '0.5rem' }}>
          License Purchase: {category.agreementName}
        </h2>

        {hasConfirmedPrice ? (
          <div style={{ margin: '1rem 0' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-body)' }}>
              ₹{((dbProduct?.priceMinor || 0) / 100).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Taxes included • Single-machine lifetime license
            </div>
          </div>
        ) : (
          <div className="placeholder-notice" role="note">
            <div>
              <strong>Pricing Notice:</strong> Official retail price is ₹480 (tax-inclusive). Per project rules, prices derive strictly from the database.
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {hasConfirmedPrice ? (
            <Link
              href={`/purchase?product=${category.slug}`}
              className="btn btn-primary"
              style={{ width: '100%', maxWidth: '320px', textAlign: 'center' }}
            >
              Purchase License
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled
              aria-disabled="true"
              style={{ width: '100%', maxWidth: '320px', cursor: 'not-allowed', opacity: 0.6 }}
            >
              Price & Checkout Pending Confirmation
            </button>
          )}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Official single-machine lifetime license. Instant digital delivery upon payment confirmation.
          </div>
        </div>
      </section>
    </div>
  );
}
