import { describe, it } from 'node:test';
import assert from 'node:assert';
import { productCategories } from '../../src/content/categories';
import { siteConfig } from '../../src/content/site';
import { homeContent } from '../../src/content/home';
import { instructionsContent } from '../../src/content/instructions';
import { faqContent } from '../../src/content/faq';
import { storyContent } from '../../src/content/story';
import { resourcesContent } from '../../src/content/resources';
import { contactContent } from '../../src/content/contact';

describe('Phase 3 Content Loader & Category Verification', () => {
  it('should load all 13 agreement categories with unique numbers and slugs', () => {
    assert.strictEqual(productCategories.length, 13, 'Must contain exactly 13 agreement categories');

    const seenNumbers = new Set<number>();
    const seenSlugs = new Set<string>();

    for (const cat of productCategories) {
      assert.ok(cat.categoryNumber >= 1 && cat.categoryNumber <= 13, `Category number out of range: ${cat.categoryNumber}`);
      assert.ok(!seenNumbers.has(cat.categoryNumber), `Duplicate category number: ${cat.categoryNumber}`);
      seenNumbers.add(cat.categoryNumber);

      assert.ok(cat.slug && cat.slug.length > 0, `Missing slug for category ${cat.categoryNumber}`);
      assert.ok(!seenSlugs.has(cat.slug), `Duplicate slug: ${cat.slug}`);
      seenSlugs.add(cat.slug);

      assert.ok(cat.agreementName && cat.agreementName.length > 0);
      assert.ok(cat.images && cat.images.length > 0, `Missing images for ${cat.slug}`);
      assert.ok(cat.manuals && cat.manuals.length > 0, `Missing manuals for ${cat.slug}`);
      for (const m of cat.manuals) {
        assert.ok(m.title && m.filename && m.url && m.size, `Invalid manual structure in ${cat.slug}`);
      }
      assert.ok(cat.deliveredFolders.length > 0, `Category ${cat.categoryNumber} must map to at least one delivered folder`);
      assert.ok(cat.logoSvg.startsWith('/logos/'), `Logo SVG must be located in /logos/: ${cat.logoSvg}`);
    }

    assert.strictEqual(seenNumbers.size, 13);
    assert.strictEqual(seenSlugs.size, 13);
  });

  it('should verify valid BCP-47 and ISO 15924 script tags for all categories', () => {
    const validScriptCodes = new Set([
      'Brah', 'Beng', 'Deva', 'Gujr', 'Knda', 'Mlym',
      'Modi', 'Orya', 'Guru', 'Taml', 'Telu', 'Tglr', 'Shrd'
    ]);

    for (const cat of productCategories) {
      assert.ok(cat.bcp47Tag.length >= 2, `Invalid BCP-47 tag for ${cat.slug}: ${cat.bcp47Tag}`);
      assert.ok(validScriptCodes.has(cat.iso15924), `Invalid ISO 15924 script tag: ${cat.iso15924}`);
      assert.ok(cat.specimenGlyphs.length > 0, `Missing specimen glyphs for ${cat.slug}`);
    }
  });

  it('should enforce at most six navigation links in the header per design brief', () => {
    assert.ok(
      siteConfig.navLinks.length <= 6,
      `Header has ${siteConfig.navLinks.length} links; maximum allowed by design brief is 6`
    );
  });

  it('should verify all required page content structures exist and contain verified content', () => {
    // Home
    assert.strictEqual(homeContent.hero.title, 'Nav Brahmi');
    assert.ok(homeContent.about.body.length >= 2);
    assert.ok(homeContent.vision.body.length >= 1);
    assert.ok(homeContent.mission.body.length >= 1);

    // Instructions
    assert.ok(instructionsContent.steps.length >= 4);
    assert.strictEqual(instructionsContent.keyboardShortcut.shortcut, 'Windows Key + Spacebar');

    // FAQ
    assert.ok(faqContent.categories.length >= 3);
    const allFaqItems = faqContent.categories.flatMap((c) => c.items);
    assert.ok(allFaqItems.length >= 6);

    // Story
    assert.ok(storyContent.sections.length >= 2);

    // Resources
    assert.ok(resourcesContent.resources.length >= 3);

    // Contact
    assert.strictEqual(contactContent.contactDetails.officialEmail, 'support@brahmicomputing.in');
    assert.strictEqual(contactContent.contactDetails.phone, '+91 98459 80534');
    assert.strictEqual(contactContent.contactDetails.location, '#75, 7th Cross, K.P. West, Bengaluru');
  });
});
