import React from 'react';
import { Skeleton } from './skeleton';

/**
 * Skeleton loading state for Product List page (/products)
 * Matches the layout and dimensions of src/app/products/page.tsx
 */
export function ProductListSkeleton() {
  return (
    <div className="container" aria-busy="true" aria-label="Loading product catalog...">
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <Skeleton variant="rect" width={120} height={24} />
        </div>
        <Skeleton variant="title" width="50%" height={38} style={{ marginBottom: '0.75rem' }} />
        <Skeleton variant="text" width="80%" height={20} style={{ marginBottom: '1rem' }} />
      </div>

      {/* Grid of Product Cards Skeleton */}
      <section>
        <div className="monitor-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="monitor-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <Skeleton width={90} height={16} style={{ marginBottom: '0.5rem' }} />
              <Skeleton variant="title" width="70%" height={24} style={{ marginBottom: '0.75rem' }} />
              <Skeleton variant="rect" width="100%" height={36} style={{ marginBottom: '0.75rem' }} />
              <Skeleton width={80} height={22} style={{ margin: '0.25rem 0 0.5rem 0' }} />
              <Skeleton variant="text" width="100%" height={14} />
              <Skeleton variant="text" width="85%" height={14} style={{ marginBottom: 'auto' }} />
              <Skeleton width={140} height={18} style={{ marginTop: '0.75rem' }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Skeleton loading state for Category/Product Detail page (/products/[slug])
 */
export function ProductDetailSkeleton() {
  return (
    <div className="container container-reading" aria-busy="true" aria-label="Loading product details...">
      {/* Breadcrumb */}
      <Skeleton width={140} height={18} style={{ marginBottom: 'var(--space-md)' }} />

      {/* Script Specimen Box */}
      <div className="script-specimen-box" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-xs)' }}>
          <Skeleton variant="rect" width={220} height={20} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
          <Skeleton variant="rect" width="70%" height={56} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Skeleton width={260} height={16} />
        </div>
      </div>

      {/* Header */}
      <header style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <Skeleton variant="rect" width={120} height={22} />
          <Skeleton variant="rect" width={150} height={22} />
        </div>
        <Skeleton variant="title" width="75%" height={40} style={{ marginBottom: '0.75rem' }} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="95%" height={20} />
        <Skeleton variant="text" width="60%" height={20} />
      </header>

      {/* Logo Card */}
      <section className="card card-subtle" style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <Skeleton width={180} height={16} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
          <Skeleton variant="rect" width={240} height={160} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Skeleton width={160} height={14} />
        </div>
      </section>

      {/* Features */}
      <section className="card" style={{ marginBottom: 'var(--space-xl)', padding: '1.5rem' }}>
        <Skeleton variant="title" width={220} height={26} style={{ marginBottom: '1rem' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton variant="text" width="90%" height={18} />
          <Skeleton variant="text" width="85%" height={18} />
          <Skeleton variant="text" width="92%" height={18} />
          <Skeleton variant="text" width="70%" height={18} />
        </div>
      </section>

      {/* Purchase Section */}
      <section className="card card-elevated" style={{ padding: '1.75rem', border: '2px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <Skeleton variant="rect" width={140} height={22} />
        </div>
        <Skeleton variant="title" width={260} height={32} style={{ marginBottom: '0.75rem' }} />
        <Skeleton width={120} height={40} style={{ marginBottom: '0.5rem' }} />
        <Skeleton width={200} height={16} style={{ marginBottom: '1.5rem' }} />
        <Skeleton variant="rect" width="100%" height={48} style={{ maxWidth: '320px' }} />
      </section>
    </div>
  );
}

/**
 * Skeleton loading state for Order Status page (/orders/[token])
 */
export function OrderStatusSkeleton() {
  return (
    <div className="container section" aria-busy="true" aria-label="Loading order details...">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <Skeleton variant="title" width={260} height={36} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Skeleton width={380} height={18} />
        </div>
      </div>

      <div className="card card-elevated" style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem' }}>
        {/* Status Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <Skeleton width={110} height={14} style={{ marginBottom: '0.35rem' }} />
            <Skeleton width={180} height={22} />
          </div>
          <Skeleton variant="rect" width={130} height={28} />
        </div>

        {/* Order Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div>
            <Skeleton width={90} height={14} style={{ marginBottom: '0.25rem' }} />
            <Skeleton width={140} height={20} />
          </div>
          <div>
            <Skeleton width={90} height={14} style={{ marginBottom: '0.25rem' }} />
            <Skeleton width={80} height={20} />
          </div>
          <div>
            <Skeleton width={90} height={14} style={{ marginBottom: '0.25rem' }} />
            <Skeleton width={160} height={20} />
          </div>
        </div>

        {/* Download Action Box */}
        <div className="card card-subtle" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <Skeleton variant="title" width={200} height={24} style={{ marginBottom: '0.5rem' }} />
          <Skeleton width="85%" height={16} style={{ marginBottom: '1rem' }} />
          <Skeleton variant="rect" width={220} height={44} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for Software Checkout page (/purchase)
 */
export function PurchaseCheckoutSkeleton() {
  return (
    <div className="container section" aria-busy="true" aria-label="Loading checkout...">
      <div style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Skeleton variant="rect" width={150} height={22} />
          <Skeleton variant="rect" width={90} height={22} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <Skeleton variant="title" width={280} height={36} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Skeleton width={440} height={18} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)', maxWidth: '980px', margin: '0 auto' }}>
        {/* Product Summary Box */}
        <div className="card card-subtle" style={{ padding: '1.75rem' }}>
          <Skeleton width={120} height={14} style={{ marginBottom: '0.5rem' }} />
          <Skeleton variant="title" width="70%" height={28} style={{ marginBottom: '0.75rem' }} />
          <Skeleton width="90%" height={16} style={{ marginBottom: '1rem' }} />
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <Skeleton width={80} height={14} style={{ marginBottom: '0.35rem' }} />
            <Skeleton width={140} height={36} />
          </div>
        </div>

        {/* Checkout Form Box */}
        <div className="card card-elevated" style={{ padding: '1.75rem' }}>
          <Skeleton variant="title" width={180} height={26} style={{ marginBottom: '1.25rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <Skeleton width={120} height={16} style={{ marginBottom: '0.4rem' }} />
              <Skeleton variant="rect" width="100%" height={44} />
            </div>
            <div>
              <Skeleton width={140} height={16} style={{ marginBottom: '0.4rem' }} />
              <Skeleton variant="rect" width="100%" height={44} />
            </div>
            <Skeleton variant="rect" width="100%" height={48} style={{ marginTop: '0.5rem' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
