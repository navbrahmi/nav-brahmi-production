import React from 'react';
import Link from 'next/link';
import { instructionsContent } from '../../content/instructions';

export const metadata = {
  title: 'Download & Installation Instructions',
  description:
    'Complete guide for downloading, installing, and configuring Nav Brahmi keyboard layout drivers on Microsoft Windows 10 and 11.',
};

export default function InstructionsPage() {
  return (
    <div className="container container-reading">
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-brand">Setup Guide</span>
          <span className="badge badge-pending">Windows 10 / 11</span>
        </div>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>
          {instructionsContent.title}
        </h1>
        <p className="hero-lead">
          {instructionsContent.subtitle}
        </p>
      </header>

      {/* System Prerequisites */}
      <section className="card card-subtle" aria-labelledby="prereq-heading" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 id="prereq-heading" style={{ fontSize: '1.35rem', marginBottom: '1rem', color: 'var(--text-body)' }}>
          System Requirements & Prerequisites
        </h2>
        <div className="table-wrap">
          <table className="data-table">
            <tbody>
              <tr>
                <th style={{ width: '35%' }}>Operating System</th>
                <td>{instructionsContent.systemRequirements.os}</td>
              </tr>
              <tr>
                <th>User Permissions</th>
                <td>
                  <strong>{instructionsContent.systemRequirements.privileges}</strong>
                </td>
              </tr>
              <tr>
                <th>Processor Architecture</th>
                <td>{instructionsContent.systemRequirements.architecture}</td>
              </tr>
              <tr>
                <th>Input Subsystem</th>
                <td>{instructionsContent.systemRequirements.framework}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Step by Step Instructions */}
      <section aria-labelledby="steps-heading" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 id="steps-heading" style={{ marginBottom: 'var(--space-lg)' }}>
          Installation Walkthrough
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {instructionsContent.steps.map((step) => (
            <div key={step.stepNumber} className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  background: 'var(--brand)',
                  color: 'var(--text-inverse)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  flexShrink: 0,
                }}
              >
                {step.stepNumber}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--text-body)' }}>
                  {step.title}
                </h3>
                <p style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
                  {step.instruction}
                </p>
                {step.notes && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', background: 'var(--surface-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    💡 <em>Note:</em> {step.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Keyboard Shortcut Highlight */}
      <section className="card card-elevated" aria-labelledby="shortcut-heading" style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)', marginBottom: 'var(--space-2xl)', border: '2px solid var(--border-subtle)' }}>
        <h2 id="shortcut-heading" style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
          Switching In Between Languages
        </h2>
        <div style={{ display: 'inline-block', background: 'var(--surface-subtle)', border: '2px solid var(--brand)', borderRadius: 'var(--radius-lg)', padding: '1rem 2rem', margin: '1rem 0' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.05em' }}>
            {instructionsContent.keyboardShortcut.shortcut}
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
          {instructionsContent.keyboardShortcut.explanation}
        </p>
      </section>

      {/* Troubleshooting */}
      <section className="card" aria-labelledby="troubleshoot-heading" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 id="troubleshoot-heading" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
          Common Troubleshooting Scenarios
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {instructionsContent.troubleshooting.map((item, idx) => (
            <div key={idx} style={{ borderBottom: idx < instructionsContent.troubleshooting.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: '0.75rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-body)' }}>
                Q: {item.issue}
              </strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
                A: {item.resolution}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Placeholder Notice */}
      <div className="placeholder-notice" role="note">
        <div>
          <strong>Media Walkthrough Status:</strong> {instructionsContent.clientNotesPending}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
        <Link href="/faq" className="btn btn-secondary" style={{ marginRight: '1rem' }}>
          View Frequently Asked Questions →
        </Link>
        <Link href="/recover" className="btn btn-secondary">
          License Recovery Tool →
        </Link>
      </div>
    </div>
  );
}
