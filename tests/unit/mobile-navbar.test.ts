import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { siteConfig } from '../../src/content/site';

describe('Mobile Navigation Bar & Responsive Hamburger Menu', () => {
  const navbarPath = path.join(process.cwd(), 'src', 'components', 'navbar.tsx');
  const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
  const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');

  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');

  it('should render Navbar client component in RootLayout', () => {
    assert.ok(layoutContent.includes('<Navbar />'), 'RootLayout must render <Navbar />');
  });

  it('should include mobile hamburger button with accessible ARIA attributes', () => {
    assert.ok(navbarContent.includes('className="mobile-nav-toggle"'), 'Navbar must include mobile-nav-toggle button');
    assert.ok(navbarContent.includes('aria-expanded={isOpen}'), 'Toggle button must manage aria-expanded');
    assert.ok(navbarContent.includes('aria-controls="mobile-nav-menu"'), 'Toggle button must control mobile-nav-menu');
    assert.ok(navbarContent.includes('aria-label={isOpen ?'), 'Toggle button must provide descriptive aria-label');
  });

  it('should render both hamburger and close icons based on menu open state', () => {
    assert.ok(navbarContent.includes('isOpen ?'), 'Must alternate icon when menu is open/closed');
    assert.ok(navbarContent.includes('<line x1="18" y1="6" x2="6" y2="18" />'), 'Must provide X close icon');
    assert.ok(navbarContent.includes('<line x1="3" y1="6" x2="21" y2="6" />'), 'Must provide 3-line hamburger icon');
  });

  it('should preserve desktop navigation on larger screens', () => {
    assert.ok(navbarContent.includes('className="desktop-nav"'), 'Desktop navigation container must exist');
    assert.ok(cssContent.includes('.desktop-nav {\n  display: block;\n}'), 'Desktop nav must be visible by default');
    assert.ok(cssContent.includes('.mobile-nav-toggle {\n  display: none;'), 'Hamburger button must be hidden on desktop');
  });

  it('should hide desktop navigation and display hamburger button on mobile (<= 768px)', () => {
    assert.ok(cssContent.includes('.desktop-nav {\n    display: none !important;'), 'Desktop nav must be hidden on mobile screens');
    assert.ok(cssContent.includes('.mobile-nav-toggle {\n    display: inline-flex !important;'), 'Hamburger toggle must be visible on mobile screens');
  });

  it('should support closing via Escape key and clicking outside', () => {
    assert.ok(navbarContent.includes("e.key === 'Escape'"), 'Must handle Escape key press');
    assert.ok(navbarContent.includes('handleClickOutside'), 'Must handle click outside to close');
  });

  it('should close menu when user clicks any navigation link', () => {
    assert.ok(navbarContent.includes('onClick={() => setIsOpen(false)}'), 'Must close menu when navigation link is clicked');
  });

  it('should keep the Nav Brahmi logo visible in mobile navbar', () => {
    assert.ok(navbarContent.includes('src="/logos/NavBrahmi-Logo.svg"'), 'Nav Brahmi logo must be present in navbar');
    assert.ok(navbarContent.includes('alt="Nav Brahmi 3x3 Monitor Logo"'), 'Logo alt text must be preserved');
    assert.ok(navbarContent.includes('<span>Nav Brahmi</span>'), 'Brand name must be present in navbar');
  });

  it('should maintain pink brand background #E51055 and white text', () => {
    assert.ok(cssContent.includes('background-color: var(--brand);'), 'Header and mobile menu must use var(--brand)');
    assert.ok(cssContent.includes('color: var(--text-inverse)'), 'Text must use white text token');
  });
});
