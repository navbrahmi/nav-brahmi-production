'use client';

import React, { useState } from 'react';
import { contactContent } from '../../content/contact';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setFeedbackMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setFeedbackMsg(contactContent.form.successMessage);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setStatus('error');
        setFeedbackMsg(data.error || contactContent.form.errorMessage);
      }
    } catch (err) {
      setStatus('error');
      setFeedbackMsg('A network error occurred. Please check your connection or contact us by email.');
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-labelledby="contact-form-title" noValidate>
      {status === 'success' && (
        <div
          role="status"
          style={{
            background: 'var(--state-success-bg)',
            color: 'var(--state-success-text)',
            border: '1px solid var(--state-success-border)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontWeight: 600,
          }}
        >
          ✓ {feedbackMsg}
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          style={{
            background: 'var(--state-error-bg)',
            color: 'var(--state-error-text)',
            border: '1px solid var(--state-error-border)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontWeight: 600,
          }}
        >
          ⚠ {feedbackMsg}
        </div>
      )}

      <div className="form-group" style={{ marginBottom: '1.15rem' }}>
        <label htmlFor="contact-name" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.35rem' }}>
          {contactContent.form.fields.nameLabel} <span style={{ color: 'var(--brand)' }}>*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="form-input"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === 'submitting'}
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.15rem' }}>
        <label htmlFor="contact-email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.35rem' }}>
          {contactContent.form.fields.emailLabel} <span style={{ color: 'var(--brand)' }}>*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="form-input"
          placeholder="your.email@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'submitting'}
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.15rem' }}>
        <label htmlFor="contact-subject" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.35rem' }}>
          {contactContent.form.fields.subjectLabel} <span style={{ color: 'var(--brand)' }}>*</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          className="form-input"
          placeholder="e.g. Ashokan Brahmi Academic Licensing"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={status === 'submitting'}
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="contact-message" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.35rem' }}>
          {contactContent.form.fields.messageLabel} <span style={{ color: 'var(--brand)' }}>*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          className="form-textarea"
          rows={4}
          placeholder="How can our team assist you with Indian language keyboard drivers?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status === 'submitting'}
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.95rem', resize: 'vertical' }}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={status === 'submitting'}
        style={{
          width: '100%',
          padding: '0.8rem 1.5rem',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.95rem',
          cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <span>{status === 'submitting' ? 'Sending Message…' : `${contactContent.form.submitLabel} →`}</span>
      </button>
    </form>
  );
}
