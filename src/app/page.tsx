import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { homeContent } from '../content/home';
import { productCategories } from '../content/categories';
import { Agentation } from "agentation";

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 min(100%, 520px)', maxWidth: '680px' }}>
            <h1 id="hero-title" style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
              {homeContent.hero.title}
            </h1>
            <p className="hero-lead">
              {homeContent.hero.description}
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <Link href="/products" className="btn btn-primary">
                Explore All 13 Categories →
              </Link>
              <Link href="/instructions" className="btn btn-secondary">
                Installation Guide
              </Link>
            </div>
          </div>

          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Image
              src="/logos/nav-brahmi-hero-logo.png"
              alt="Nav Brahmi 3x3 Monitor Identity"
              width={220}
              height={230}
              priority
              style={{ width: 'auto', maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }}
            />
          </div>
        </div>
      </section>

      {/* Patented Keyboard Layout Showcase */}
      <section aria-label="Nav Brahmi Patented Keyboard Showcase" style={{ marginBottom: 'var(--space-3xl)' }}>
        <div
          className="card card-elevated"
          style={{
            padding: 'var(--space-md)',
            textAlign: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <Image
            src="/images/NB-KB-for-FontPage.gif"
            alt="Nav Brahmi Patented Bilingual Keyboard Layout for Indian Languages"
            width={1086}
            height={506}
            priority
            unoptimized
            style={{
              width: '100%',
              maxWidth: '980px',
              height: 'auto',
              margin: '0 auto',
              display: 'block',
              borderRadius: 'var(--radius-md)',
            }}
          />
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
              <div className="monitor-card-title">{cat.agreementName}</div>
              <div className={`monitor-card-script-sample font-script-${cat.slug}`} lang={cat.bcp47Tag} data-script={cat.iso15924}>
                {cat.specimenGlyphs}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
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
      </section>

      {/* Our Vision */}
      <section className="card" aria-labelledby="vision-heading" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 id="vision-heading" style={{ color: 'var(--brand)', marginBottom: '1rem' }}>
          {homeContent.vision.heading}
        </h2>
        {homeContent.vision.body.map((p, idx) => (
          <p key={idx} style={{ color: 'var(--text-body)', lineHeight: '1.7', fontSize: '1.05rem', marginBottom: '1rem' }}>
            {p}
          </p>
        ))}
      </section>
      <Agentation />
    </div>
  );
}
