import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Public Products & Dynamic Pricing API
 * 
 * Returns all active products with their live pricing pulled directly from Supabase PostgreSQL.
 * Guarantees that clients and UI components receive the exact database price at all times.
 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        slug: true,
        name: true,
        description: true,
        price: true,
        priceMinor: true,
        currency: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        code: p.code,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.price,
        priceMinor: p.priceMinor,
        currency: p.currency || 'INR',
        formattedPrice: p.priceMinor ? `₹${(p.priceMinor / 100).toFixed(2)}` : null,
        isCheckoutAllowed: p.priceMinor !== null && p.priceMinor > 0,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Unable to retrieve live products catalog.',
        },
      },
      { status: 500 }
    );
  }
}
