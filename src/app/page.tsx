import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { homeContent } from '../content/home';
import { productCategories } from '../content/categories';

export const metadata = {
  title: 'Home — Indian Language Keyboard Drivers & Typography',
  description:
    'Nav Brahmi provides native Windows keyboard layout drivers and Unicode typography for 13 classical and modern Indian language categories.',
};

export default function HomePage() {
  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <span className="badge badge-brand">Official Software Suite</span>
          <span className="badge badge-pending">Native Windows Drivers</span>
        </div>
        <h1 id="hero-title" style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          {homeContent.hero.title}
        </h1>
        <p className="hero-lead">
          {homeContent.hero.description}
        </p>

        {/* C-33 Tagline Notice */}
        <div className="placeholder-notice" role="note" style={{ maxWidth: '720px' }}>
          <strong>Notice:</strong> {homeContent.hero.taglineNotice}
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <Link href="/products" className="btn btn-primary">
            Explore All 13 Categories →
          </Link>
          <Link href="/instructions" className="btn btn-secondary">
            Installation Guide
          </Link>
        </div>
      </section>

      {/* 3x3 Monitor Grid Motif */}
      <section aria-labelledby="motif-heading" style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto var(--space-xl) auto' }}>
          <h2 id="motif-heading">{homeContent.motifGrid.heading}</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {homeContent.motifGrid.subheading}
          </p>
        </div>

        <div className="monitor-grid monitor-grid-3col">
          {productCategories.slice(0, 9).map((cat) => (
            <Link
              key={cat.id}
              href={`/products/${cat.slug}`}
              className="monitor-card"
              aria-label={`View ${cat.agreementName} keyboard driver`}
            >
              <div className="monitor-card-category-num">Category {cat.categoryNumber}</div>
              <div className="monitor-card-title">{cat.agreementName}</div>
              <div className="monitor-card-script-sample" lang={cat.bcp47Tag}>
                {cat.specimenGlyphs}
              </div>
              <div className="monitor-card-logo-wrap">
                <Image
                  src={cat.logoSvg}
                  alt={`${cat.scriptName} Official Logo`}
                  width={140}
                  height={120}
                  loading="lazy"
                />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                {cat.overview.slice(0, 110)}…
              </p>
              <span style={{ fontSize: '0.875rem', color: 'var(--link)', fontWeight: 600, marginTop: 'auto', paddingTop: '0.75rem' }}>
                View specifications & details →
              </span>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
          <Link href="/products" className="btn btn-secondary">
            View All 13 Language Categories & Packages ({productCategories.length}) →
          </Link>
        </div>
      </section>

      {/* About Nav Brahmi */}
      <section className="card card-elevated" aria-labelledby="about-heading" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 id="about-heading" style={{ color: 'var(--brand)', marginBottom: '1rem' }}>
          {homeContent.about.heading}
        </h2>
        {homeContent.about.body.map((paragraph, idx) => (
          <p key={idx} style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
            {paragraph}
          </p>
        ))}
        <div className="placeholder-notice" role="note">
          <strong>Review Note:</strong> {homeContent.about.approvalNotice}
        </div>
      </section>

      {/* Vision and Mission Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
        <div className="card">
          <h2 style={{ color: 'var(--brand)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            {homeContent.vision.heading}
          </h2>
          {homeContent.vision.body.map((p, idx) => (
            <p key={idx} style={{ color: 'var(--text-body)', lineHeight: '1.65' }}>
              {p}
            </p>
          ))}
        </div>

        <div className="card">
          <h2 style={{ color: 'var(--brand)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            {homeContent.mission.heading}
          </h2>
          {homeContent.mission.body.map((p, idx) => (
            <p key={idx} style={{ color: 'var(--text-body)', lineHeight: '1.65' }}>
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* Overview of Work and Products */}
      <section className="card card-subtle" aria-labelledby="overview-heading">
        <h2 id="overview-heading" style={{ marginBottom: '0.75rem' }}>
          {homeContent.overview.heading}
        </h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', marginBottom: '1.5rem' }}>
          {homeContent.overview.body}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Agreement Categories
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand)' }}>
              {homeContent.overview.statSummary.categoriesCount}
            </div>
          </div>
          <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Packages Delivered
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand)' }}>
              {homeContent.overview.statSummary.productsDelivered}
            </div>
          </div>
          <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Target Environment
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-body)' }}>
              {homeContent.overview.statSummary.operatingSystem}
            </div>
          </div>
          <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Standard
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-body)' }}>
              {homeContent.overview.statSummary.standard}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
