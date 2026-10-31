import { prisma } from '../src/lib/prisma';
import { productCategories } from '../src/content/categories';

export async function seedAuthoritativeProducts() {
  console.log('[SEED] Seeding authoritative products into database...');

  const created: any[] = [];
  for (const cat of productCategories) {
    const code = cat.slug.toUpperCase().replace(/-/g, '_');
    // Confirmed price per C-02/C-03: ₹472 retail (47200 paise) for all language packages.
    const priceMinor = 47200;
    const price = 472.0;

    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug: cat.slug }, { code }],
      },
    });

    if (existing) {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: cat.agreementName,
          description: cat.overview,
          price,
          priceMinor,
          currency: 'INR',
          slug: cat.slug,
          code,
          isActive: true,
        },
      });
      created.push(updated);
      console.log(`- Updated: ${updated.slug} (${updated.id}) - Price: ${priceMinor ? `₹${(priceMinor / 100).toFixed(2)}` : 'PENDING'}`);
    } else {
      const newProd = await prisma.product.create({
        data: {
          name: cat.agreementName,
          description: cat.overview,
          price,
          priceMinor,
          currency: 'INR',
          slug: cat.slug,
          code,
          isActive: true,
        },
      });
      created.push(newProd);
      console.log(`- Created: ${newProd.slug} (${newProd.id}) - Price: ${priceMinor ? `₹${(priceMinor / 100).toFixed(2)}` : 'PENDING'}`);
    }
  }

  console.log(`[SEED] Finished seeding ${created.length} authoritative products.`);
  return created;
}

if (process.argv[1]?.endsWith('seed-authoritative-products.ts')) {
  seedAuthoritativeProducts()
    .catch((err) => {
      console.error('[SEED ERROR]', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
