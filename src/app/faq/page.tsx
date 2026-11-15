import React from 'react';
import Link from 'next/link';
import { faqContent } from '../../content/faq';
import { FaqAccordion } from './faq-client';

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

      {/* Modern FAQ Categories Accordion */}
      <FaqAccordion categories={faqContent.categories} />

      {/* Support Callout */}
      <div className="card card-subtle" style={{ textAlign: 'center', marginTop: 'var(--space-2xl)', borderRadius: '16px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--text-body)' }}>
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
