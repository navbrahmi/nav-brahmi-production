import { describe, it } from 'node:test';
import assert from 'node:assert';
import { productCategories } from '../../src/content/categories';
import {
  AUTHORITATIVE_PRODUCTS,
  CONFIRMED_RETAIL_PRICE_MINOR,
  CONFIRMED_RETAIL_PRICE_INR,
} from '../../src/lib/products';

describe('Product Catalog & Pricing Verification (C-02 & C-03)', () => {
  it('should verify ₹472 is consistently represented as 47200 paise with no additional tax added', () => {
    assert.strictEqual(CONFIRMED_RETAIL_PRICE_MINOR, 47200, 'paise must be 47200');
    assert.strictEqual(CONFIRMED_RETAIL_PRICE_INR, 472.0, 'rupees must be 472.00');

    for (const prod of AUTHORITATIVE_PRODUCTS) {
      if (prod.priceMinor !== null) {
        // Price minor must be exactly 47200 paise
        assert.strictEqual(
          prod.priceMinor,
          47200,
          `Product ${prod.slug} priceMinor must be 47200 paise (₹472.00)`
        );

        // Computed rupees must equal 472.00
        const inRupees = prod.priceMinor / 100;
        assert.strictEqual(inRupees, 472.0);

        // Verification that no automatic +18% tax is added (472 * 1.18 = 556.96)
        assert.notStrictEqual(
          prod.priceMinor,
          55696,
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
    assert.strictEqual(tuluProd.categoryNumber, 12);

    // Check in content categories
    const catKannada = productCategories.find((c) => c.slug === 'kannada');
    const catTulu = productCategories.find((c) => c.slug === 'tulu');

    assert.ok(catKannada, 'Category for Kannada must exist');
    assert.ok(catTulu, 'Category for Tulu must exist');
    assert.notStrictEqual(catKannada.id, catTulu.id);
    assert.deepStrictEqual(catKannada.deliveredFolders, ['Kannada']);
    assert.deepStrictEqual(catTulu.deliveredFolders, ['Tulu']);
  });

  it('should verify Tamil and Tamil Grantha price is confirmed to ₹472.00 (47200 paise)', () => {
    const tamilProd = AUTHORITATIVE_PRODUCTS.find((p) => p.slug === 'tamil-and-grantha');
    assert.ok(tamilProd, 'Tamil and Grantha entry exists in catalog');
    assert.strictEqual(
      tamilProd.priceMinor,
      47200,
      'Tamil and Grantha must have priceMinor: 47200 paise (₹472.00)'
    );
    assert.strictEqual(tamilProd.price, 472.0, 'Tamil and Grantha price in rupees must be 472.00');
    assert.strictEqual(tamilProd.isCheckoutAllowed, true, 'Checkout must be allowed');
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
