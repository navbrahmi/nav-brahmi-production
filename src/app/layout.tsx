import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '../content/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.canonicalBase),
  title: {
    default: 'Nav Brahmi — Official Indian Language Keyboard Drivers',
    template: '%s | Nav Brahmi',
  },
  description:
    'Native Microsoft Windows keyboard layout drivers and authentic Unicode typography for classical and modern Indian scripts.',
  openGraph: {
    title: 'Nav Brahmi — Official Indian Language Keyboard Drivers',
    description:
      'Native Microsoft Windows keyboard layout drivers and authentic Unicode typography for classical and modern Indian scripts.',
    url: siteConfig.canonicalBase,
    siteName: 'Nav Brahmi',
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="header-brand" aria-label="Nav Brahmi Home">
              <Image
                src="/logos/NavBrahmi-Logo.svg"
                alt="Nav Brahmi 3x3 Monitor Logo"
                width={40}
                height={44}
                className="header-brand-logo"
                priority
              />
              <span>Nav Brahmi</span>
            </Link>

            <nav aria-label="Main Navigation">
              <ul className="nav-menu">
                {siteConfig.navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="nav-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <main id="main-content" className="main-content">
          {children}
        </main>

        <footer className="site-footer">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-col" style={{ gridColumn: 'span 1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <Image
                    src="/logos/NavBrahmi-Logo.svg"
                    alt="Nav Brahmi Logo"
                    width={28}
                    height={32}
                  />
                  <strong style={{ color: 'var(--text-body)', fontSize: '1.1rem' }}>Nav Brahmi</strong>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Native Microsoft Windows keyboard layout drivers and Unicode typography for Indian languages.
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Proprietor: {siteConfig.contact.proprietor}, {siteConfig.contact.city}.
                </p>
              </div>

              <div className="footer-col">
                <h4>Navigation</h4>
                <ul className="footer-links">
                  {siteConfig.footerLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="footer-col">
                <h4>Customer Support</h4>
                <ul className="footer-links">
                  <li>
                    <Link href="/recover">License & Installer Recovery</Link>
                  </li>
                  <li>
                    <Link href="/instructions">Installation Guide</Link>
                  </li>
                  <li>
                    <Link href="/faq">Frequently Asked Questions</Link>
                  </li>
                  <li>
                    <Link href="/contact">Contact Support</Link>
                  </li>
                </ul>
              </div>

              <div className="footer-col">
                <h4>System Architecture</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Platform: Microsoft Windows 10 & 11 (x64 / x86)
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Integration: Native Language Bar
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Shortcut: Windows Key + Spacebar
                </p>
              </div>
            </div>

            <div className="footer-bottom">
              <div>
                © {new Date().getFullYear()} Nav Brahmi. All rights reserved.
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link href="/recover" style={{ color: 'var(--text-muted)' }}>
                  License Recovery
                </Link>
                <span>•</span>
                <Link href="/contact" style={{ color: 'var(--text-muted)' }}>
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
