import React from 'react';
import Link from 'next/link';
import { faqContent } from '../../content/faq';

export const metadata = {
  title: 'FAQ & Help — Questions and Support',
  description:
    'Frequently Asked Questions regarding Nav Brahmi keyboard drivers, licensing rules, Windows compatibility, and technical support.',
};

export default function FAQPage() {
  return (
    <div className="container container-reading">
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          {faqContent.title}
        </h1>
        <p className="hero-lead">
          {faqContent.subtitle}
        </p>
      </header>

      {/* FAQ Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
        {faqContent.categories.map((category, catIdx) => (
          <section key={catIdx} className="card" aria-labelledby={`cat-heading-${catIdx}`}>
            <h2 id={`cat-heading-${catIdx}`} style={{ fontSize: '1.4rem', color: 'var(--brand)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              {category.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {category.items.map((item, itemIdx) => {
                const isPlaceholder = item.answer.includes('PLACEHOLDER');
                return (
                  <article key={itemIdx} style={{ borderBottom: itemIdx < category.items.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-body)' }}>
                      {item.question}
                    </h3>
                    {isPlaceholder ? (
                      <div className="placeholder-notice" role="note" style={{ margin: '0.5rem 0' }}>
                        <div>
                          <strong>Pending Client Policy:</strong> {item.answer}
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-body)', lineHeight: '1.6', margin: 0 }}>
                        {item.answer}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Support Callout */}
      <div className="card card-subtle" style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
          Have a Question Not Listed Here?
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Our team is available to assist with academic licensing, installation inquiries, and script specifications.
        </p>
        <Link href="/contact" className="btn btn-primary">
          Contact Support Team →
        </Link>
      </div>
    </div>
  );
}
