import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || 'all';

  let dateFilter: Date | undefined;
  const now = new Date();
  if (range === 'today') {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === '7d') {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === 'year') {
    dateFilter = new Date(now.getFullYear(), 0, 1);
  }

  const whereClause: any = dateFilter ? { createdAt: { gte: dateFilter } } : {};

  // Fetch orders matching date filter
  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      product: true,
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch all active products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  const successfulStatuses = ['PAID', 'LICENSE_ISSUED', 'DELIVERED'];

  let totalProductsSold = 0;
  let totalEarningsMinor = 0;
  let refundedAmountMinor = 0;
  let refundedCount = 0;

  const ordersByStatus: Record<string, number> = {
    PAID: 0,
    DELIVERED: 0,
    LICENSE_ISSUED: 0,
    REFUNDED: 0,
    NEEDS_ATTENTION: 0,
    FAILED: 0,
    CREATED: 0,
    PAYMENT_PENDING: 0,
  };

  const productStatsMap = new Map<
    string,
    {
      productId: string;
      code: string;
      name: string;
      slug: string;
      unitsSold: number;
      revenueMinor: number;
      refundsCount: number;
    }
  >();

  for (const p of products) {
    productStatsMap.set(p.id, {
      productId: p.id,
      code: p.code || p.id,
      name: p.name,
      slug: p.slug || '',
      unitsSold: 0,
      revenueMinor: 0,
      refundsCount: 0,
    });
  }

  for (const order of orders) {
    const st = order.status;
    ordersByStatus[st] = (ordersByStatus[st] || 0) + 1;

    const pStat = productStatsMap.get(order.productId);

    if (successfulStatuses.includes(st)) {
      totalProductsSold += 1;
      totalEarningsMinor += order.amountMinor;
      if (pStat) {
        pStat.unitsSold += 1;
        pStat.revenueMinor += order.amountMinor;
      }
    } else if (st === 'REFUNDED') {
      refundedAmountMinor += order.amountMinor;
      refundedCount += 1;
      if (pStat) {
        pStat.refundsCount += 1;
      }
    }
  }

  const netEarningsMinor = totalEarningsMinor - refundedAmountMinor;

  const productBreakdown = Array.from(productStatsMap.values()).sort(
    (a, b) => b.revenueMinor - a.revenueMinor
  );

  return NextResponse.json({
    success: true,
    filter: range,
    totalProductsSold,
    totalEarningsMinor,
    totalEarningsINR: totalEarningsMinor / 100,
    refundedAmountMinor,
    refundedAmountINR: refundedAmountMinor / 100,
    refundedCount,
    netEarningsMinor,
    netEarningsINR: netEarningsMinor / 100,
    ordersCount: orders.length,
    ordersByStatus,
    productBreakdown,
  });
}

