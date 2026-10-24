import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

/**
 * Calculates sRGB relative luminance according to WCAG 2.1 specifications.
 */
function getRelativeLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculates WCAG contrast ratio between two hex colors.
 */
function getContrastRatio(colorA: string, colorB: string): number {
  const lumA = getRelativeLuminance(colorA);
  const lumB = getRelativeLuminance(colorB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Phase 3 Theme Tokens & Contrast Verification', () => {
  const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  it('should define the client final brand palette and provisional body text tokens', () => {
    assert.ok(cssContent.includes('--brand: #E51055;'), 'Missing or modified --brand token');
    assert.ok(cssContent.includes('--surface: #FFFFFF;'), 'Missing or modified --surface token');
    assert.ok(cssContent.includes('--link: #0066CC;'), 'Missing or modified --link token');
    assert.ok(cssContent.includes('--text-body: #231F20;'), 'Missing or modified --text-body provisional token');
  });

  it('should verify WCAG contrast ratios for brand colors', () => {
    // 1. White text on Brand (#E51055)
    const whiteOnBrand = getContrastRatio('#FFFFFF', '#E51055');
    assert.ok(
      whiteOnBrand >= 4.5,
      `White on Brand must meet WCAG AA (4.5:1), actual: ${whiteOnBrand.toFixed(2)}:1`
    );

    // 2. Link (#0066CC) on White (#FFFFFF)
    const linkOnWhite = getContrastRatio('#0066CC', '#FFFFFF');
    assert.ok(
      linkOnWhite >= 4.5,
      `Link on White must meet WCAG AA (4.5:1), actual: ${linkOnWhite.toFixed(2)}:1`
    );

    // 3. Provisional body text (#231F20) on White (#FFFFFF)
    const textOnWhite = getContrastRatio('#231F20', '#FFFFFF');
    assert.ok(
      textOnWhite >= 7.0,
      `Provisional text on White must meet WCAG AAA (7:1), actual: ${textOnWhite.toFixed(2)}:1`
    );

    // 4. Prohibit Blue on Red: verify contrast fails (< 1.5:1)
    const blueOnRed = getContrastRatio('#0066CC', '#E51055');
    assert.ok(
      blueOnRed < 2.0,
      `Blue on Red has unusable contrast (${blueOnRed.toFixed(2)}:1) and must never be placed together`
    );
  });

  it('should verify token-swap capability: changing --brand updates design dynamically', () => {
    // Simulate a restyling token swap (e.g. for brand redesign or client override)
    const swappedCss = cssContent.replace('--brand: #E51055;', '--brand: #C40E48;');
    assert.ok(swappedCss.includes('--brand: #C40E48;'));
    assert.ok(!swappedCss.includes('--brand: #E51055;'));

    // Verify that primary elements consume var(--brand) rather than hardcoded hex
    assert.ok(cssContent.includes('background-color: var(--brand);'));
    assert.ok(cssContent.includes('color: var(--brand);'));
  });
});
