import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    include: {
      packages: {
        where: { isActive: true },
        select: { id: true, architecture: true, version: true, objectKey: true },
      },
      _count: {
        select: { orders: true, licenses: true },
      },
    },
    orderBy: { code: 'asc' },
  });

  return NextResponse.json({
    success: true,
    products: products.map((p) => ({
      id: p.id,
      code: p.code,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: p.price,
      priceMinor: p.priceMinor,
      priceINR: p.priceMinor ? p.priceMinor / 100 : p.price,
      currency: p.currency || 'INR',
      taxInclusive: p.taxInclusive ?? true,
      isActive: p.isActive,
      packagesCount: p.packages.length,
      packages: p.packages,
      ordersCount: p._count.orders,
      licensesCount: p._count.licenses,
      createdAt: p.createdAt,
    })),
  });
}

export async function PUT(req: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, priceINR, taxInclusive, isActive, name, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (priceINR !== undefined && priceINR !== null) {
      const parsedPrice = parseFloat(priceINR);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 });
      }
      updateData.price = parsedPrice;
      updateData.priceMinor = Math.round(parsedPrice * 100);
    }

    if (taxInclusive !== undefined) {
      updateData.taxInclusive = Boolean(taxInclusive);
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (name && typeof name === 'string') {
      updateData.name = name.trim();
    }

    if (description && typeof description === 'string') {
      updateData.description = description.trim();
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    await recordAuditEvent({
      type: 'PRODUCT_UPDATED_BY_ADMIN',
      actorType: 'ADMIN',
      refId: id,
      metadata: {
        productId: id,
        productCode: existing.code,
        previousPriceMinor: existing.priceMinor,
        newPriceMinor: updated.priceMinor,
        previousIsActive: existing.isActive,
        newIsActive: updated.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Product ${updated.name} updated successfully.`,
      product: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        description: updated.description,
        priceINR: updated.priceMinor ? updated.priceMinor / 100 : updated.price,
        priceMinor: updated.priceMinor,
        isActive: updated.isActive,
        taxInclusive: updated.taxInclusive,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update product' }, { status: 500 });
  }
}
