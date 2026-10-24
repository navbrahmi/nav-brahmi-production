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
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FECACA',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontWeight: 600,
          }}
        >
          ⚠ {feedbackMsg}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="contact-name" className="form-label">
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
        />
      </div>

      <div className="form-group">
        <label htmlFor="contact-email" className="form-label">
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
        />
      </div>

      <div className="form-group">
        <label htmlFor="contact-subject" className="form-label">
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
        />
      </div>

      <div className="form-group">
        <label htmlFor="contact-message" className="form-label">
          {contactContent.form.fields.messageLabel} <span style={{ color: 'var(--brand)' }}>*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          className="form-textarea"
          rows={5}
          placeholder="How can our team assist you with Indian language keyboard drivers?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status === 'submitting'}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={status === 'submitting'}
        style={{ width: '100%', cursor: status === 'submitting' ? 'not-allowed' : 'pointer' }}
      >
        {status === 'submitting' ? 'Sending Message…' : contactContent.form.submitLabel}
      </button>
    </form>
  );
}
