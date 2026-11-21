'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';

export function SiteShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // In the admin dashboard and admin login, isolate completely from the public site navigation & footer
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" className="main-content">
        {children}
      </main>

      {footer}
    </>
  );
}

