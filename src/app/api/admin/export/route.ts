import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: {
      product: { select: { name: true, code: true } },
      payments: { select: { providerPaymentId: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = [
    [
      'Order ID',
      'Date (UTC)',
      'Customer Name',
      'Customer Email',
      'Product Code',
      'Product Name',
      'Amount (INR)',
      'Currency',
      'Status',
      'Payment ID',
    ],
  ];

  for (const o of orders) {
    rows.push([
      `"${o.id}"`,
      `"${o.createdAt.toISOString()}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${o.customerEmail.replace(/"/g, '""')}"`,
      `"${o.product?.code || ''}"`,
      `"${(o.product?.name || '').replace(/"/g, '""')}"`,
      (o.amountMinor / 100).toFixed(2),
      o.currency,
      o.status,
      `"${o.payments[0]?.providerPaymentId || ''}"`,
    ]);
  }

  const csvContent = rows.map((r) => r.join(',')).join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="navbrahmi-orders-export-${Date.now()}.csv"`,
    },
  });
}

