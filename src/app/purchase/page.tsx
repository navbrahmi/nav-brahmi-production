import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { productCategories, ProductCategory } from '@/content/categories';
import { CheckoutClient } from './checkout-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Purchase License | Nav Brahmi',
  description:
    'Purchase your official Nav Brahmi keyboard layout driver license with instant machine-bound activation.',
};

export default async function PurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: requestedProduct } = await searchParams;

  let dbProduct = null;

  if (requestedProduct) {
    dbProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { id: requestedProduct },
          { slug: requestedProduct },
          { code: requestedProduct },
        ],
        isActive: true,
      },
    });
  }

  // Fallback to first active product with confirmed pricing if none specified
  if (!dbProduct) {
    dbProduct = await prisma.product.findFirst({
      where: {
        priceMinor: { not: null, gt: 0 },
        isActive: true,
      },
    });
  }

  // Match category details from content definitions
  const matchingCategory = productCategories.find(
    (c: ProductCategory) => c.slug === dbProduct?.slug || c.agreementName === dbProduct?.name
  );

  return (
    <div className="container section">
      <div style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge badge-brand">Official License Purchase</span>
          <span className="badge badge-pending">TEST MODE</span>
        </div>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.5rem' }}>Software Checkout</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', fontSize: '1rem' }}>
          Acquire an authorized lifetime license for your native Windows Indic keyboard layout driver.
        </p>
      </div>

      {!dbProduct || !dbProduct.priceMinor ? (
        <div className="card card-subtle" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--brand)', marginBottom: '0.75rem' }}>
            Pricing Pending Confirmation (C-02)
          </h2>
          <p style={{ color: 'var(--text-body)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Official retail pricing for this software category is currently awaiting final client
            confirmation. Online checkout will become active as soon as approved pricing is confirmed.
          </p>
          <Link href="/products" className="btn btn-secondary">
            Return to Product Catalog
          </Link>
        </div>
      ) : (
        <CheckoutClient
          product={{
            id: dbProduct.id,
            slug: dbProduct.slug,
            name: dbProduct.name,
            description:
              matchingCategory?.overview ||
              dbProduct.description ||
              'Official Nav Brahmi Windows Keyboard Layout Driver',
            priceMinor: dbProduct.priceMinor,
            currency: dbProduct.currency || 'INR',
          }}
        />
      )}
    </div>
  );
}
