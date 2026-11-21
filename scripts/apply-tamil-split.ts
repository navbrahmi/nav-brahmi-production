/**
 * Applies the confirmed Tamil / Tamil Grantha product split to the database.
 *
 * - Creates or updates the standalone TAMIL and TAMIL_GRANTHA product rows.
 * - Retires the old combined TAMIL_AND_GRANTHA row (isActive = false) so it can
 *   no longer be purchased, while preserving it for historical order references.
 *
 * The new products are created INACTIVE by default because no driver packages
 * have been registered for them yet. Activate them only after their x64/x86
 * packages have been uploaded to Backblaze B2 and registered as ProductPackage
 * rows:
 *
 *   npx tsx scripts/apply-tamil-split.ts --apply --activate
 *
 * Idempotent. Dry-run by default.
 */
import { prisma } from '../src/lib/prisma';
import { productCategories } from '../src/content/categories';
import {
  CONFIRMED_RETAIL_PRICE_INR,
  CONFIRMED_RETAIL_PRICE_MINOR,
} from '../src/lib/products';

const TARGET_SLUGS = ['tamil', 'tamil-grantha'] as const;
const RETIRED_SLUG = 'tamil-and-grantha';
const RETIRED_CODE = 'TAMIL_AND_GRANTHA';

async function main() {
  const apply = process.argv.includes('--apply');
  const activate = process.argv.includes('--activate');

  console.log('================================================================');
  console.log(` Tamil Product Split [${apply ? 'APPLY' : 'DRY RUN'}]${activate ? ' + activate new products' : ''}`);
  console.log('================================================================\n');

  for (const slug of TARGET_SLUGS) {
    const category = productCategories.find((c) => c.slug === slug);
    if (!category) {
      throw new Error(`Category "${slug}" is missing from src/content/categories.ts`);
    }

    const code = slug.toUpperCase().replace(/-/g, '_');
    const existing = await prisma.product.findFirst({
      where: { OR: [{ slug }, { code }] },
    });

    // Never silently re-activate an existing product unless explicitly requested.
    const isActive = activate ? true : (existing?.isActive ?? false);

    const data = {
      name: category.agreementName,
      description: category.overview,
      price: CONFIRMED_RETAIL_PRICE_INR,
      priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
      currency: 'INR',
      taxInclusive: true,
      slug,
      code,
      isActive,
    };

    if (!apply) {
      console.log(
        `[${existing ? 'UPDATE' : 'CREATE'}] ${code} (${slug}) -> ₹${(CONFIRMED_RETAIL_PRICE_MINOR / 100).toFixed(2)}, active: ${isActive}`
      );
      continue;
    }

    if (existing) {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data,
      });
      console.log(`✓ Updated ${updated.code} (${updated.id}) - active: ${updated.isActive}`);
    } else {
      const created = await prisma.product.create({ data });
      console.log(`✓ Created ${created.code} (${created.id}) - active: ${created.isActive}`);
    }
  }

  const retired = await prisma.product.findFirst({
    where: {
      OR: [{ slug: RETIRED_SLUG }, { code: RETIRED_CODE }],
    },
  });

  if (!retired) {
    console.log(`\n[RETIRE] No combined product found (${RETIRED_CODE}); nothing to retire.`);
  } else {
    console.log(
      `\n[RETIRE] ${retired.code} (${retired.id}) -> isActive: ${retired.isActive} => false`
    );
    if (apply && retired.isActive) {
      await prisma.product.update({
        where: { id: retired.id },
        data: { isActive: false },
      });
      console.log('✓ Combined product retired; historical rows preserved.');
    }
  }

  if (apply) {
    const rows = await prisma.product.findMany({
      where: {
        OR: [
          ...TARGET_SLUGS.map((slug) => ({ slug })),
          { slug: RETIRED_SLUG },
          { code: RETIRED_CODE },
        ],
      },
      select: { code: true, slug: true, priceMinor: true, isActive: true },
      orderBy: { code: 'asc' },
    });
    console.log('\nVerification:');
    for (const row of rows) {
      console.log(
        `  ${(row.code || '').padEnd(16)} ${(row.slug || '').padEnd(18)} ₹${((row.priceMinor || 0) / 100).toFixed(2).padStart(7)} active=${row.isActive}`
      );
    }
  }

  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error('[TAMIL-SPLIT ERROR]', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
