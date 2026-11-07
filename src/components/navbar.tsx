'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { siteConfig } from '../content/site';

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Close menu when route changes
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        toggleButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (!isOpen) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          href="/"
          className="header-brand"
          aria-label="Nav Brahmi Home"
          onClick={() => setIsOpen(false)}
        >
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

        {/* Desktop Navigation - Preserved exactly as existing on desktop/laptop */}
        <nav aria-label="Main Navigation" className="desktop-nav">
          <ul className="nav-menu">
            {siteConfig.navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Hamburger / Close Button */}
        <button
          ref={toggleButtonRef}
          type="button"
          className="mobile-nav-toggle"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-nav-menu"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {isOpen && (
        <>
          <div
            className="mobile-nav-backdrop"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
          />
          <nav
            id="mobile-nav-menu"
            ref={menuRef}
            className="mobile-nav-menu"
            aria-label="Mobile Navigation"
          >
            <div className="container">
              <ul className="mobile-nav-list">
                {siteConfig.navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`mobile-nav-link ${pathname === link.href ? 'active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{link.label}</span>
                      <span className="mobile-nav-arrow" aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
