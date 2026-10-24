import React from 'react';
import { contactContent } from '../../content/contact';
import { ContactForm } from './contact-form';

export const metadata = {
  title: 'Contact Us — Official Contact & Inquiries',
  description:
    'Contact the Nav Brahmi team for inquiries regarding Indian language keyboard drivers, academic licensing, or support.',
};

export default function ContactPage() {
  return (
    <div className="container container-reading">
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-brand">Get in Touch</span>
          <span className="badge badge-pending">Direct Communication</span>
        </div>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          {contactContent.title}
        </h1>
        <p className="hero-lead">
          {contactContent.subtitle}
        </p>
      </header>

      {/* Grid: Contact Information & Working Contact Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
        {/* Contact Details Card */}
        <section className="card card-subtle" aria-labelledby="details-heading">
          <h2 id="details-heading" style={{ fontSize: '1.35rem', marginBottom: '1rem', color: 'var(--text-body)' }}>
            Official Information
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Organization & Proprietor
              </strong>
              <div>{contactContent.contactDetails.organization}</div>
              <div style={{ color: 'var(--text-muted)' }}>{contactContent.contactDetails.proprietor}</div>
            </div>

            <div>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Operational Location
              </strong>
              <div>{contactContent.contactDetails.location}</div>
            </div>

            <div>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Official Email
              </strong>
              <a href={`mailto:${contactContent.contactDetails.officialEmail}`} style={{ fontWeight: 600 }}>
                {contactContent.contactDetails.officialEmail}
              </a>
            </div>

            <div>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Working Hours
              </strong>
              <div>{contactContent.contactDetails.hours}</div>
            </div>
          </div>

          <div className="placeholder-notice" role="note" style={{ marginTop: '1.5rem' }}>
            <div>{contactContent.contactDetails.phonePendingNotice}</div>
          </div>
        </section>

        {/* Working Contact Form */}
        <section className="card card-elevated" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: 'var(--brand)' }}>
            {contactContent.form.title}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {contactContent.form.description}
          </p>

          <ContactForm />
        </section>
      </div>

      {/* Backend Integration Notice */}
      <div className="placeholder-notice" role="note">
        <div>
          <strong>Mailbox Relay Notice:</strong> {contactContent.openDecisionNotice}
        </div>
      </div>
    </div>
  );
}
