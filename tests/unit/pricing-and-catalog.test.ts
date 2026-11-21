import { describe, it } from 'node:test';
import assert from 'node:assert';
import { productCategories } from '../../src/content/categories';
import {
  AUTHORITATIVE_PRODUCTS,
  CONFIRMED_RETAIL_PRICE_MINOR,
  CONFIRMED_RETAIL_PRICE_INR,
} from '../../src/lib/products';

describe('Product Catalog & Pricing Verification (C-02 & C-03)', () => {
  it('should verify ₹480 is consistently represented as 48000 paise with no additional tax added', () => {
    assert.strictEqual(CONFIRMED_RETAIL_PRICE_MINOR, 48000, 'paise must be 48000');
    assert.strictEqual(CONFIRMED_RETAIL_PRICE_INR, 480.0, 'rupees must be 480.00');

    for (const prod of AUTHORITATIVE_PRODUCTS) {
      if (prod.priceMinor !== null) {
        // Price minor must be exactly 48000 paise
        assert.strictEqual(
          prod.priceMinor,
          48000,
          `Product ${prod.slug} priceMinor must be 48000 paise (₹480.00)`
        );

        // Computed rupees must equal 480.00
        const inRupees = prod.priceMinor / 100;
        assert.strictEqual(inRupees, 480.0);

        // Verification that no automatic +18% tax is added (480 * 1.18 = 566.40)
        assert.notStrictEqual(
          prod.priceMinor,
          56640,
          'Product price must NOT have an automatic 18% GST added on top'
        );
      }
    }
  });

  it('should verify Kannada and Tulu are distinct standalone products', () => {
    const kannadaProd = AUTHORITATIVE_PRODUCTS.find((p) => p.slug === 'kannada');
    const tuluProd = AUTHORITATIVE_PRODUCTS.find((p) => p.slug === 'tulu');

    assert.ok(kannadaProd, 'Kannada product record must exist');
    assert.ok(tuluProd, 'Tulu product record must exist');

    assert.notStrictEqual(kannadaProd.code, tuluProd.code, 'Kannada and Tulu must have distinct codes');
    assert.strictEqual(kannadaProd.code, 'KANNADA');
    assert.strictEqual(tuluProd.code, 'TULU');

    // Distinct category folders
    assert.strictEqual(kannadaProd.folderName, 'Kannada');
    assert.strictEqual(tuluProd.folderName, 'Tulu');
    assert.strictEqual(kannadaProd.categoryNumber, 5);
    assert.strictEqual(tuluProd.categoryNumber, 13);

    // Check in content categories
    const catKannada = productCategories.find((c) => c.slug === 'kannada');
    const catTulu = productCategories.find((c) => c.slug === 'tulu');

    assert.ok(catKannada, 'Category for Kannada must exist');
    assert.ok(catTulu, 'Category for Tulu must exist');
    assert.notStrictEqual(catKannada.id, catTulu.id);
    assert.deepStrictEqual(catKannada.deliveredFolders, ['Kannada']);
    assert.deepStrictEqual(catTulu.deliveredFolders, ['Tulu']);
  });

  it('should verify Tamil and Tamil Grantha are distinct standalone products with confirmed ₹480 price', () => {
    const tamilProd = AUTHORITATIVE_PRODUCTS.find((p) => p.slug === 'tamil');
    const granthaProd = AUTHORITATIVE_PRODUCTS.find((p) => p.slug === 'tamil-grantha');

    assert.ok(tamilProd, 'Tamil product record must exist');
    assert.ok(granthaProd, 'Tamil Grantha product record must exist');

    assert.notStrictEqual(tamilProd.code, granthaProd.code, 'Tamil and Tamil Grantha must have distinct codes');
    assert.strictEqual(tamilProd.code, 'TAMIL');
    assert.strictEqual(granthaProd.code, 'TAMIL_GRANTHA');

    assert.strictEqual(tamilProd.priceMinor, 48000, 'Tamil must have priceMinor: 48000 paise (₹480.00)');
    assert.strictEqual(granthaProd.priceMinor, 48000, 'Tamil Grantha must have priceMinor: 48000 paise (₹480.00)');
    assert.strictEqual(tamilProd.price, 480.0);
    assert.strictEqual(granthaProd.price, 480.0);

    assert.strictEqual(tamilProd.isCheckoutAllowed, true);
    assert.strictEqual(granthaProd.isCheckoutAllowed, true);

    // Check categories
    const catTamil = productCategories.find((c) => c.slug === 'tamil');
    const catGrantha = productCategories.find((c) => c.slug === 'tamil-grantha');

    assert.ok(catTamil, 'Category for Tamil must exist');
    assert.ok(catGrantha, 'Category for Tamil Grantha must exist');
    assert.notStrictEqual(catTamil.id, catGrantha.id);
    assert.deepStrictEqual(catTamil.deliveredFolders, ['Tamil']);
    assert.deepStrictEqual(catGrantha.deliveredFolders, ['Tamil Grantha']);
  });

  it('should verify catalog mapping preserves 1:1 boundaries for Tamil and Tamil Grantha without mixing', () => {
    const tamil = AUTHORITATIVE_PRODUCTS.find((p) => p.code === 'TAMIL');
    const grantha = AUTHORITATIVE_PRODUCTS.find((p) => p.code === 'TAMIL_GRANTHA');

    assert.ok(tamil);
    assert.ok(grantha);

    assert.ok(!tamil.folderName.toLowerCase().includes('grantha'));
    assert.ok(grantha.folderName.toLowerCase().includes('grantha'));
    assert.ok(!tamil.msklcFolder.toLowerCase().includes('grantha'));
    assert.ok(grantha.msklcFolder.toLowerCase().includes('grantha'));
  });

  it('should verify catalog mapping preserves 1:1 boundaries for Kannada and Tulu without mixing', () => {
    const kannada = AUTHORITATIVE_PRODUCTS.find((p) => p.code === 'KANNADA');
    const tulu = AUTHORITATIVE_PRODUCTS.find((p) => p.code === 'TULU');

    assert.ok(kannada);
    assert.ok(tulu);

    // Verify folder mappings do not cross
    assert.ok(!kannada.folderName.toLowerCase().includes('tulu'));
    assert.ok(!tulu.folderName.toLowerCase().includes('kannada'));
    assert.ok(!kannada.msklcFolder.toLowerCase().includes('tulu'));
    assert.ok(!tulu.msklcFolder.toLowerCase().includes('kannada'));
  });
});
