import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { productCategories } from '../../src/content/categories';
import { PRODUCT_FONT_MANIFEST, getApprovedFontsForProduct } from '../../src/lib/font-manifest';

describe('Indic Font Requirements & Verification', () => {
  const publicFontsDir = path.resolve(process.cwd(), 'public/fonts');
  const globalsCssPath = path.resolve(process.cwd(), 'src/app/globals.css');
  const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

  const EXPECTED_FONTS = [
    { language: 'Ashokan Brahmi', slug: 'ashokan-brahmi', fontName: 'Noto Sans Brahmi', filename: 'NotoSansBrahmi-Regular.ttf' },
    { language: 'Bengali', slug: 'bengali', fontName: 'Noto Sans Bengali', filename: 'NotoSansBengali-Regular.ttf' },
    { language: 'Devanagari / Hindi', slug: 'devanagari-hindi', fontName: 'Noto Sans Devanagari', filename: 'NotoSansDevanagari-Regular.ttf' },
    { language: 'Gujarati', slug: 'gujarati', fontName: 'Noto Sans Gujarati', filename: 'NotoSansGujarati-Regular.ttf' },
    { language: 'Kannada', slug: 'kannada', fontName: 'Noto Sans Kannada', filename: 'NotoSansKannada-RegularNJ.ttf' },
    { language: 'Malayalam', slug: 'malayalam', fontName: 'Noto Sans Malayalam', filename: 'NotoSansMalayalam-Regular.ttf' },
    { language: 'Modi / Marathi', slug: 'modi-marathi', fontName: 'Noto Sans Modi', filename: 'NotoSansModi-Regular.ttf' },
    { language: 'Oriya / Odia', slug: 'oriya-odia', fontName: 'Noto Sans Oriya', filename: 'NotoSansOriya-Regular.ttf' },
    { language: 'Punjabi / Gurmukhi', slug: 'punjabi-gurmukhi', fontName: 'Noto Sans Gurmukhi', filename: 'NotoSansGurmukhi-Regular.ttf' },
    { language: 'Tamil', slug: 'tamil', fontName: 'Noto Sans Tamil', filename: 'NotoSansTamil-Regular.ttf' },
    { language: 'Tamil Grantha', slug: 'tamil-grantha', fontName: 'Noto Sans Grantha', filename: 'NotoSansGrantha-Regular.ttf' },
    { language: 'Telugu', slug: 'telugu', fontName: 'Noto Sans Telugu', filename: 'NotoSansTelugu-Regular.ttf' },
    { language: 'Tulu', slug: 'tulu', fontName: 'Brahmi Tulu-Tigalari', filename: 'Brahmi_Tulu_Tigalari_Refined_Regular-refined.ttf' },
    { language: 'Sharada', slug: 'sharada', fontName: 'Noto Sans Sharada', filename: 'NotoSansSharada-Regular.ttf' },
  ];

  it('1. should verify all 14 required font files exist in public/fonts for web delivery', () => {
    assert.ok(fs.existsSync(publicFontsDir), 'public/fonts directory must exist');

    for (const font of EXPECTED_FONTS) {
      const fontFilePath = path.join(publicFontsDir, font.filename);
      assert.ok(
        fs.existsSync(fontFilePath),
        `Missing font file in public/fonts/: ${font.filename} for ${font.language}`
      );
      const stats = fs.statSync(fontFilePath);
      assert.ok(stats.size > 10000, `Font file ${font.filename} appears too small (${stats.size} bytes)`);
    }
  });

  it('2. should verify @font-face rules are defined in globals.css for each font', () => {
    for (const font of EXPECTED_FONTS) {
      assert.ok(
        globalsCss.includes(`font-family: '${font.fontName}'`) || globalsCss.includes(`font-family: "${font.fontName}"`),
        `globals.css must define @font-face for ${font.fontName}`
      );
      assert.ok(
        globalsCss.includes(font.filename),
        `globals.css must reference ${font.filename}`
      );
    }
  });

  it('3. should verify script-specific language selectors are configured in globals.css', () => {
    const scriptSelectors = [
      ':lang(pra-Brah)',
      ':lang(bn-Beng)',
      ':lang(hi-Deva)',
      ':lang(gu-Gujr)',
      ':lang(kn-Knda)',
      ':lang(ml-Mlym)',
      ':lang(mr-Modi)',
      ':lang(or-Orya)',
      ':lang(pa-Guru)',
      ':lang(ta-Taml)',
      ':lang(ta-Gran)',
      ':lang(te-Telu)',
      ':lang(tcy-Tglr)',
      ':lang(ks-Shrd)',
    ];

    for (const sel of scriptSelectors) {
      assert.ok(globalsCss.includes(sel), `globals.css must include selector ${sel}`);
    }
  });

  it('4. should verify every category in categories.ts has defaultFont matching client requirements', () => {
    for (const cat of productCategories) {
      assert.ok(cat.defaultFont && cat.defaultFont.length > 0, `Category ${cat.slug} must define defaultFont`);
      if (cat.slug === 'ashokan-brahmi') assert.strictEqual(cat.defaultFont, 'Noto Sans Brahmi');
      if (cat.slug === 'bengali') assert.strictEqual(cat.defaultFont, 'Noto Sans Bengali');
      if (cat.slug === 'devanagari-hindi') assert.strictEqual(cat.defaultFont, 'Noto Sans Devanagari');
      if (cat.slug === 'gujarati') assert.strictEqual(cat.defaultFont, 'Noto Sans Gujarati');
      if (cat.slug === 'kannada') assert.strictEqual(cat.defaultFont, 'Noto Sans Kannada');
      if (cat.slug === 'malayalam') assert.strictEqual(cat.defaultFont, 'Noto Sans Malayalam');
      if (cat.slug === 'modi-marathi') assert.strictEqual(cat.defaultFont, 'Noto Sans Modi');
      if (cat.slug === 'oriya-odia') assert.strictEqual(cat.defaultFont, 'Noto Sans Oriya');
      if (cat.slug === 'punjabi-gurmukhi') assert.strictEqual(cat.defaultFont, 'Noto Sans Gurmukhi');
      if (cat.slug === 'tamil-and-grantha') assert.ok(cat.defaultFont.includes('Tamil') && cat.defaultFont.includes('Grantha'));
      if (cat.slug === 'telugu') assert.strictEqual(cat.defaultFont, 'Noto Sans Telugu');
      if (cat.slug === 'tulu') assert.ok(cat.defaultFont.includes('Brahmi Tulu-Tigalari'));
      if (cat.slug === 'sharada') assert.strictEqual(cat.defaultFont, 'Noto Sans Sharada');
    }
  });

  it('5. should verify Bengali strictly uses Noto Sans Bengali and NEVER Noto Sans Newa', () => {
    const bengaliFonts = getApprovedFontsForProduct('bengali');
    assert.ok(bengaliFonts.includes('NotoSansBengali-Regular.ttf'));
    assert.strictEqual(bengaliFonts.some(f => f.toLowerCase().includes('newa')), false);
  });

  it('6. should verify each package directory in Requirements/Software contains its approved font', () => {
    const packageMappings = [
      { slug: 'ashokan-brahmi', dir: 'Requirements/Software/Ashokan Brahmi/Ashokan Brahmi', font: 'NotoSansBrahmi-Regular.ttf' },
      { slug: 'bengali', dir: 'Requirements/Software/Bengali/Bengali', font: 'NotoSansBengali-Regular.ttf' },
      { slug: 'devanagari-hindi', dir: 'Requirements/Software/Devanagari/Devanagari', font: 'NotoSansDevanagari-Regular.ttf' },
      { slug: 'gujarati', dir: 'Requirements/Software/Gujarati/Gujarati', font: 'NotoSansGujarati-Regular.ttf' },
      { slug: 'kannada', dir: 'Requirements/Software/Kannada/Kannada', font: 'NotoSansKannada-RegularNJ.ttf' },
      { slug: 'malayalam', dir: 'Requirements/Software/Malayalam/Malayalam', font: 'NotoSansMalayalam-Regular.ttf' },
      { slug: 'modi-marathi', dir: 'Requirements/Software/Modi-Marathi/Modi-Marathi', font: 'NotoSansModi-Regular.ttf' },
      { slug: 'oriya-odia', dir: 'Requirements/Software/Oriya-Odia/Odia', font: 'NotoSansOriya-Regular.ttf' },
      { slug: 'punjabi-gurmukhi', dir: 'Requirements/Software/Punjabi-Gurumuki/Punjabi-Gurumuki', font: 'NotoSansGurmukhi-Regular.ttf' },
      { slug: 'sharada', dir: 'Requirements/Software/Sharada/Sharada', font: 'NotoSansSharada-Regular.ttf' },
      { slug: 'tamil', dir: 'Requirements/Software/Tamil/Tamil', font: 'NotoSansTamil-Regular.ttf' },
      { slug: 'tamil-grantha', dir: 'Requirements/Software/Tamil Grantha/Tamil Grantha', font: 'NotoSansGrantha-Regular.ttf' },
      { slug: 'telugu', dir: 'Requirements/Software/Telugu/Telugu', font: 'NotoSansTelugu-Regular.ttf' },
      { slug: 'tulu', dir: 'Requirements/Software/Tulu/Tulu', font: 'Brahmi_Tulu_Tigalari_Refined_Regular-refined.ttf' },
    ];

    for (const pkg of packageMappings) {
      const fontPath = path.resolve(process.cwd(), pkg.dir, pkg.font);
      assert.ok(
        fs.existsSync(fontPath),
        `Package directory ${pkg.dir} must contain integrated font ${pkg.font}`
      );
    }
  });

  it('7. should verify bootstrapper Program.cs ProductApprovedFonts covers all products', () => {
    const programCsPath = path.resolve(process.cwd(), 'Requirements/windows-driver/bootstrapper/Program.cs');
    const programCs = fs.readFileSync(programCsPath, 'utf8');

    for (const font of EXPECTED_FONTS) {
      assert.ok(
        programCs.includes(font.filename),
        `Program.cs must include ${font.filename} in ProductApprovedFonts allowlist`
      );
    }
  });
});
