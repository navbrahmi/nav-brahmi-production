import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productCategories } from '../../content/categories';
import { prisma } from '../../lib/prisma';

export const metadata = {
  title: 'Products — All 13 Language Categories & 14 Driver Packages',
  description:
    'Catalog of all 13 official Nav Brahmi agreement categories mapped to the 14 delivered Windows keyboard driver packages.',
};

export default async function ProductsPage() {
  // Fetch real database products if configured, otherwise handle gracefully
  let dbProducts: Array<{ slug: string | null; priceMinor: number | null; price: number }> = [];
  try {
    dbProducts = await prisma.product.findMany({
      select: { slug: true, priceMinor: true, price: true },
    });
  } catch (err) {
    // If DB is offline during build/static generation, handle gracefully
    dbProducts = [];
  }

  const dbProductMap = new Map(
    dbProducts.filter((p) => p.slug).map((p) => [p.slug as string, p])
  );

  return (
    <div className="container">
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <span className="badge badge-brand">Product Catalog</span>
          <span className="badge badge-pending">13 Categories / 14 Packages</span>
        </div>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          Language Categories & Keyboard Driver Packages
        </h1>
        <p className="hero-lead" style={{ marginBottom: '1rem' }}>
          Explore the 13 official agreement categories mapped directly to the 14 client-delivered software packages.
          Display spellings are PROPOSED; final bundle selections and prices are subject to client confirmation.
        </p>

        {/* C-03 & C-02 Explanatory Notice */}
        <div className="placeholder-notice" role="note">
          <div>
            <strong>Open Decision C-03 & C-02:</strong> Bundles for categories specified as &quot;… and Devanagari&quot; (such as whether customers receive a combined installer or separate downloads) and retail price confirmation are pending client confirmation. Prices shown below derive only from the database.
          </div>
        </div>
      </div>

      {/* Catalog Mapping Table */}
      <section className="card card-elevated" aria-labelledby="matrix-heading" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 id="matrix-heading" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          Agreement Category Mapping Matrix (Agreement §02 vs Client Delivery)
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          This table documents the 13 categories from the signed agreement and how they map to the 14 delivered software packages.
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Agreement Category</th>
                <th>Delivered Package Folder(s)</th>
                <th>Script Tag (BCP-47)</th>
                <th>Database Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {productCategories.map((cat) => {
                const dbProd = dbProductMap.get(cat.slug);
                let priceDisplay = 'Price pending confirmation (C-02)';
                if (dbProd?.priceMinor) {
                  priceDisplay = `₹${(dbProd.priceMinor / 100).toFixed(2)}`;
                } else if (dbProd && dbProd.price > 0 && dbProd.price !== 39.0) {
                  priceDisplay = `₹${dbProd.price.toFixed(2)}`;
                }

                return (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: 700 }}>{cat.categoryNumber}</td>
                    <td>
                      <strong>{cat.agreementName}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Script: {cat.scriptName}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.825rem', background: 'var(--surface-subtle)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        {cat.deliveredFolders.join(' + ')}
                      </code>
                    </td>
                    <td>
                      <span className="script-specimen-tag" lang={cat.bcp47Tag}>
                        {cat.bcp47Tag}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: dbProd?.priceMinor ? 'var(--text-body)' : 'var(--state-pending-text)' }}>
                      {priceDisplay}
                    </td>
                    <td>
                      <Link href={`/products/${cat.slug}`} style={{ fontWeight: 600 }}>
                        View Details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grid of Category Cards */}
      <section aria-labelledby="cards-heading">
        <h2 id="cards-heading" style={{ marginBottom: 'var(--space-lg)' }}>
          Browse Individual Language Pages
        </h2>

        <div className="monitor-grid">
          {productCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products/${cat.slug}`}
              className="monitor-card"
              aria-label={`View ${cat.agreementName} page`}
            >
              <div className="monitor-card-category-num">Category {cat.categoryNumber}</div>
              <div className="monitor-card-title">{cat.agreementName}</div>
              <div className="monitor-card-script-sample" lang={cat.bcp47Tag}>
                {cat.specimenGlyphs}
              </div>
              <div className="monitor-card-logo-wrap">
                <Image
                  src={cat.logoSvg}
                  alt={`${cat.scriptName} Logo`}
                  width={140}
                  height={120}
                  loading="lazy"
                />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                {cat.overview.slice(0, 120)}…
              </p>
              <span style={{ fontSize: '0.875rem', color: 'var(--link)', fontWeight: 600, marginTop: 'auto', paddingTop: '0.75rem' }}>
                Open category page →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
