import React from 'react';
import Link from 'next/link';
import { productCategories } from '../../content/categories';
import { prisma } from '../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Products — Keyboard Layout Drivers & Typography',
  description:
    'Catalog of Nav Brahmi native Windows keyboard layout drivers and Unicode typography for Indian languages.',
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
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          Language Keyboard Driver Packages
        </h1>
        <p className="hero-lead" style={{ marginBottom: '1rem' }}>
          Explore official Nav Brahmi native Microsoft Windows keyboard layout drivers and authentic Unicode typography for Indian languages.
        </p>
      </div>

      {/* Grid of Product Cards */}
      <section aria-labelledby="cards-heading">
        <div className="monitor-grid">
          {productCategories.map((cat) => {
            const dbProd = dbProductMap.get(cat.slug);
            let cardPrice = '₹480.00';
            if (dbProd?.priceMinor !== null && dbProd?.priceMinor !== undefined) {
              cardPrice = `₹${(dbProd.priceMinor / 100).toFixed(2)}`;
            } else if (dbProd?.price !== null && dbProd?.price !== undefined) {
              cardPrice = `₹${dbProd.price.toFixed(2)}`;
            }

            return (
              <Link
                key={cat.id}
                href={`/products/${cat.slug}`}
                className="monitor-card"
                aria-label={`View ${cat.agreementName} page`}
              >
                <div className="monitor-card-title">{cat.agreementName}</div>
                <div className={`monitor-card-script-sample font-script-${cat.slug}`} lang={cat.bcp47Tag} data-script={cat.iso15924}>
                  {cat.specimenGlyphs}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-body)', margin: '0.25rem 0' }}>
                  {cardPrice}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                  {cat.overview.slice(0, 120)}…
                </p>
                <span style={{ fontSize: '0.875rem', color: 'var(--link)', fontWeight: 600, marginTop: 'auto', paddingTop: '0.75rem' }}>
                  View details & purchase →
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
