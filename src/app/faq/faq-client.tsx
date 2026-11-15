'use client';

import React, { useState } from 'react';
import { FAQCategory } from '../../content/faq';

export function FaqAccordion({ categories }: { categories: FAQCategory[] }) {
  // Store an open set of item keys e.g. "0-0", "1-0", etc. Initialize with first item of each category open
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    '0-0': true,
    '1-0': true,
    '2-0': true,
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {categories.map((category, catIdx) => (
        <section
          key={catIdx}
          aria-labelledby={`cat-heading-${catIdx}`}
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '2rem',
            boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(229, 16, 85, 0.08)',
                color: 'var(--brand)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {catIdx + 1}
            </span>
            <h2
              id={`cat-heading-${catIdx}`}
              style={{
                fontSize: '1.35rem',
                color: 'var(--text-body)',
                margin: 0,
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              {category.title}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {category.items.map((item, itemIdx) => {
              const itemKey = `${catIdx}-${itemIdx}`;
              const isOpen = !!openItems[itemKey];
              const isPlaceholder = item.answer.includes('PLACEHOLDER');

              return (
                <div
                  key={itemIdx}
                  style={{
                    borderRadius: '12px',
                    border: isOpen ? '1.5px solid rgba(229, 16, 85, 0.35)' : '1px solid var(--border-subtle)',
                    backgroundColor: isOpen ? '#FFFFFF' : '#FAFAFA',
                    boxShadow: isOpen ? '0 4px 12px rgba(229, 16, 85, 0.06)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(itemKey)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      padding: '1.1rem 1.25rem',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: isOpen ? 'var(--brand)' : 'var(--text-body)',
                      fontWeight: 600,
                      fontSize: '1.02rem',
                    }}
                  >
                    <span style={{ lineHeight: '1.45', flex: 1 }}>{item.question}</span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isOpen ? 'rgba(229, 16, 85, 0.1)' : 'var(--surface)',
                        color: isOpen ? 'var(--brand)' : 'var(--text-muted)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 1.25rem 1.25rem 1.25rem',
                        color: 'var(--text-body)',
                        fontSize: '0.95rem',
                        lineHeight: '1.68',
                      }}
                    >
                      <div
                        style={{
                          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                          paddingTop: '0.85rem',
                        }}
                      >
                        {isPlaceholder ? (
                          <div className="placeholder-notice" role="note" style={{ margin: 0 }}>
                            <div>
                              <strong>Pending Client Policy:</strong> {item.answer}
                            </div>
                          </div>
                        ) : (
                          <p style={{ margin: 0 }}>{item.answer}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

