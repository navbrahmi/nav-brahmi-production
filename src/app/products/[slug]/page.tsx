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
        <div className="script-specimen-large" lang={category.bcp47Tag} aria-label={`${category.scriptName} Script Specimen`}>
          {category.specimenGlyphs}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Authentic script specimen from official Nav Brahmi materials
        </div>
      </div>

      {/* Header and Title */}
      <header style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-brand">Category {category.categoryNumber} of 13</span>
          <span className="badge badge-pending">Native Windows Driver</span>
        </div>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          {category.agreementName}
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {category.overview}
        </p>
      </header>

      {/* Official Identity Logo */}
      <section className="card card-subtle" style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Official Client-Supplied Identity Asset
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
          <Image
            src={category.logoSvg}
            alt={`${category.agreementName} Official Logo`}
            width={240}
            height={180}
            style={{ maxWidth: '100%', height: 'auto' }}
            priority
          />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Source: Client delivery zip (Nav-Brahmi-Logos)
        </div>
      </section>

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
                <th>Included Assets</th>
                <td>
                  {category.manualAsset} • {category.stickerAsset}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Media & Resources (Placeholders per C-17 and C-29) */}
      <section className="card card-subtle" style={{ marginBottom: 'var(--space-2xl)' }} aria-labelledby="media-heading">
        <h2 id="media-heading" style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--text-body)' }}>
          Screenshots, Video Walkthrough & Fonts
        </h2>
        <div className="placeholder-notice" role="note">
          <div>
            <strong>Screenshots:</strong> {category.screenshots}
          </div>
        </div>
        <div className="placeholder-notice" role="note">
          <div>
            <strong>Demonstration Video:</strong> {category.videos}
          </div>
        </div>
        <div className="placeholder-notice" role="note">
          <div>
            <strong>Typography Downloads:</strong> {category.fontLinks}
          </div>
        </div>
      </section>

      {/* Purchase Entry Section */}
      <section className="card card-elevated" aria-labelledby="purchase-heading" style={{ border: '2px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-brand">Purchase & Licensing</span>
          <span className="badge badge-pending">Phase 4 Feature</span>
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
              <strong>Pricing Notice:</strong> Official retail price is pending client confirmation (C-02). Manuals state ₹480 tax-inclusive; invoice template calculates ₹472. Per project rules, prices derive strictly from the database.
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
              Purchase License (TEST MODE)
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
            Checkout operates in Razorpay TEST MODE. No live payments will be processed until client credentials and approved legal policies are activated.
          </div>
        </div>
      </section>

      {/* Open Questions Notice */}
      <section style={{ marginTop: 'var(--space-2xl)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Traceability & Open Client Decisions for this Category
        </h3>
        <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {category.openQuestions.map((q, idx) => (
            <li key={idx}>{q}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
