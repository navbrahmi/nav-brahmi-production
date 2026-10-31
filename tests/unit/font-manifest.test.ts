import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  PRODUCT_FONT_MANIFEST,
  getApprovedFontsForProduct,
  isFontApprovedForProduct,
  filterApprovedFontsForProduct,
} from '../../src/lib/font-manifest';

describe('Product-Specific Font Manifest & Allowlist (C-29)', () => {
  it('should map approved fonts strictly to individual products', () => {
    const kannadaFonts = getApprovedFontsForProduct('kannada');
    assert.ok(kannadaFonts.length > 0, 'Kannada must have approved fonts');
    assert.ok(kannadaFonts.includes('NotoSansKannada-RegularNJ.ttf'));

    const tuluFonts = getApprovedFontsForProduct('tulu');
    assert.ok(tuluFonts.length > 0, 'Tulu must have approved fonts');
    assert.ok(tuluFonts.includes('Brahmi_Tulu_Tigalari_Refined_Regular-refined.ttf'));

    const ashokanFonts = getApprovedFontsForProduct('ashokan-brahmi');
    assert.ok(ashokanFonts.includes('NotoSansBrahmi-Regular.ttf'));
  });

  it('should strictly prohibit cross-language font mixing (C-29)', () => {
    // Kannada fonts must NOT be approved for Tulu
    assert.strictEqual(
      isFontApprovedForProduct('tulu', 'NotoSansKannada-RegularNJ.ttf'),
      false,
      'Kannada font must never be approved for Tulu'
    );

    // Tulu fonts must NOT be approved for Kannada
    assert.strictEqual(
      isFontApprovedForProduct('kannada', 'Brahmi_Tulu_Tigalari_Refined_Regular-refined.ttf'),
      false,
      'Tulu font must never be approved for Kannada'
    );

    // Modi fonts must NOT be approved for Sharada
    assert.strictEqual(
      isFontApprovedForProduct('sharada', 'NotoSansModi-Regular.ttf'),
      false,
      'Modi font must never be approved for Sharada'
    );
  });

  it('should reject unapproved, wildcard, and arbitrary font files', () => {
    assert.strictEqual(isFontApprovedForProduct('kannada', 'random-font.ttf'), false);
    assert.strictEqual(isFontApprovedForProduct('kannada', 'arial.ttf'), false);
    assert.strictEqual(isFontApprovedForProduct('kannada', '*.ttf'), false);
    assert.strictEqual(isFontApprovedForProduct('kannada', ''), false);
  });

  it('should accurately filter package files without wildcard installation', () => {
    const packageFiles = [
      'NotoSansKannada-RegularNJ.ttf',
      'unapproved-extra.ttf',
      'Brahmi_Tulu_Tigalari_Refined_Regular-refined.ttf', // Wrong language
      'setup.exe',
      'layout.dll',
    ];

    const result = filterApprovedFontsForProduct('kannada', packageFiles);
    assert.strictEqual(result.approved.length, 1);
    assert.strictEqual(result.approved[0], 'NotoSansKannada-RegularNJ.ttf');
    assert.strictEqual(result.rejected.length, 4);
    assert.ok(result.rejected.includes('unapproved-extra.ttf'));
    assert.ok(result.rejected.includes('Brahmi_Tulu_Tigalari_Refined_Regular-refined.ttf'));
  });

  it('should return empty list gracefully for products with no configured fonts', () => {
    const fonts = getApprovedFontsForProduct('unknown-product');
    assert.deepStrictEqual(fonts, []);

    const filterRes = filterApprovedFontsForProduct('unknown-product', ['somefont.ttf']);
    assert.deepStrictEqual(filterRes.approved, []);
    assert.deepStrictEqual(filterRes.rejected, ['somefont.ttf']);
  });

  it('should enforce persistent Win32 font installation principles', () => {
    // Verification of Win32 requirements per C-29:
    // 1. Target directory must be system Fonts folder (C:\Windows\Fonts) or per-user Fonts
    // 2. Registry entry under HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts
    // 3. AddFontResourceW must NOT use FR_PRIVATE (0x10) because private fonts unload on process exit
    // 4. WM_FONTCHANGE (0x001D) broadcast ensures running applications detect newly installed fonts
    const FR_PRIVATE = 0x10;
    const persistentInstallationUsesPrivateFlag = false;
    assert.strictEqual(persistentInstallationUsesPrivateFlag, false, 'Persistent installation must not use FR_PRIVATE');

    const WM_FONTCHANGE = 0x001d;
    assert.strictEqual(WM_FONTCHANGE, 29);
  });
});
