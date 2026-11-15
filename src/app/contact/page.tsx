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
    <div className="container" style={{ maxWidth: '1060px', paddingBottom: 'var(--space-2xl)' }}>
      <header style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          {contactContent.title}
        </h1>
        <p className="hero-lead" style={{ maxWidth: '680px', margin: '0 auto' }}>
          {contactContent.subtitle}
        </p>
      </header>

      {/* Grid: Modern Contact Information & Working Contact Form */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
          gap: '2rem',
          alignItems: 'stretch',
        }}
      >
        {/* Official Information Card */}
        <section
          aria-labelledby="details-heading"
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '2rem',
            boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--brand)',
                  backgroundColor: 'rgba(229, 16, 85, 0.08)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  display: 'inline-block',
                  marginBottom: '0.5rem',
                }}
              >
                Official Directory
              </span>
              <h2
                id="details-heading"
                style={{
                  fontSize: '1.4rem',
                  margin: 0,
                  color: 'var(--text-body)',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                }}
              >
                Official Information
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                Direct contact details for Nav Brahmi corporate administration and technical assistance.
              </p>
            </div>

            {/* Contact Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Address */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand)',
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Headquarters & Address
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-body)', fontSize: '0.95rem', marginTop: '0.15rem' }}>
                    {contactContent.contactDetails.organization}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.4', marginTop: '0.15rem' }}>
                    No. 75, 7th Cross, Kumara Park West, Bengaluru – 560020, Karnataka, India
                  </div>
                </div>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand)',
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Official Support Email
                  </div>
                  <a
                    href={`mailto:${contactContent.contactDetails.officialEmail}`}
                    style={{
                      display: 'inline-block',
                      color: 'var(--brand)',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      marginTop: '0.15rem',
                      textDecoration: 'none',
                    }}
                  >
                    {contactContent.contactDetails.officialEmail}
                  </a>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.1rem' }}>
                    Expected response: within 24 business hours
                  </div>
                </div>
              </div>

              {/* Telephone */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand)',
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Telephone Support
                  </div>
                  <a
                    href={`tel:${contactContent.contactDetails.phone}`}
                    style={{
                      display: 'inline-block',
                      color: 'var(--text-body)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      marginTop: '0.15rem',
                      textDecoration: 'none',
                    }}
                  >
                    {contactContent.contactDetails.phone}
                  </a>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.1rem' }}>
                    Monday – Saturday: 9:30 AM – 6:30 PM IST
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Information Card: Registrations & Quick Actions */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Enterprise Registration
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>GSTIN:</span>{' '}
                  <code style={{ fontSize: '0.85rem', fontWeight: 600 }}>29BQKPJ9659M1ZQ</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>MSME:</span>{' '}
                  <code style={{ fontSize: '0.85rem', fontWeight: 600 }}>UDYAM-KR-03-0731072</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <a
                href={`mailto:${contactContent.contactDetails.officialEmail}`}
                className="btn btn-secondary"
                style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                ✉ Email Support
              </a>
              <a
                href={`tel:${contactContent.contactDetails.phone}`}
                className="btn btn-secondary"
                style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                📞 Call Desk
              </a>
            </div>
          </div>
        </section>

        {/* Send a Message Form Card */}
        <section
          aria-labelledby="contact-form-title"
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '2rem',
            boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#059669',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                display: 'inline-block',
                marginBottom: '0.5rem',
              }}
            >
              Direct Message
            </span>
            <h2
              id="contact-form-title"
              style={{
                fontSize: '1.4rem',
                margin: 0,
                color: 'var(--text-body)',
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              {contactContent.form.title}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
              {contactContent.form.description}
            </p>
          </div>

          <ContactForm />
        </section>
      </div>
    </div>
  );
}
