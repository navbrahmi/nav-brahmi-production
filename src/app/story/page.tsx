import React from 'react';
import Link from 'next/link';
import { storyContent } from '../../content/story';

export const metadata = {
  title: 'How Brahmi Became User-Friendly — The Nav Brahmi Story',
  description:
    'The historical journey of deciphering ancient Brahmi script and creating an intuitive, bilingual keyboard for digital computing.',
};

export default function StoryPage() {
  return (
    <div className="container container-reading">
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-brand">Historical Narrative</span>
          <span className="badge badge-pending">Heritage & Computing</span>
        </div>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          {storyContent.title}
        </h1>
        <p className="hero-lead">
          {storyContent.subtitle}
        </p>
      </header>

      {/* Script Specimen Accent */}
      <div className="script-specimen-box" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
        <div
          className="script-specimen-large script-brahmi"
          lang="pra-Brah"
          data-script="Brah"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          aria-hidden="true"
        >
          𑀦𑀯 𑀩𑁆𑀭𑀸𑀳𑁆𑀫𑀻
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Classical Brahmi script: The ancestor of major South and Southeast Asian writing systems
        </div>
      </div>

      {/* Introduction */}
      <article className="card card-elevated" style={{ marginBottom: 'var(--space-2xl)' }}>
        <p style={{ fontSize: '1.15rem', lineHeight: '1.75', color: 'var(--text-body)', margin: 0 }}>
          {storyContent.introduction}
        </p>
      </article>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        {storyContent.sections.map((section, idx) => (
          <section key={idx} className="card">
            <h2 style={{ fontSize: '1.4rem', color: 'var(--brand)', marginBottom: '1rem' }}>
              {section.title}
            </h2>
            {section.paragraphs.map((p, pIdx) => (
              <p key={pIdx} style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-body)' }}>
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      {/* Placeholder Notice */}
      <div className="placeholder-notice" role="note" style={{ marginTop: 'var(--space-xl)' }}>
        <div>
          <strong>Narrative Status:</strong> {storyContent.clientSubmissionPending}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
        <Link href="/products" className="btn btn-primary" style={{ marginRight: '1rem' }}>
          Explore Brahmi & Indic Drivers →
        </Link>
        <Link href="/contact" className="btn btn-secondary">
          Get in Touch
        </Link>
      </div>
    </div>
  );
}
