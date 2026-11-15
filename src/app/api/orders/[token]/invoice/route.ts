import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTaxInvoice } from '@/lib/invoice';
import { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const order = await prisma.order.findUnique({
      where: { publicToken: token },
      include: {
        product: true,
        payments: {
          where: { status: 'CAPTURED' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: { code: 'ORDER_NOT_FOUND', message: 'Order not found.' } },
        { status: 404 }
      );
    }

    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.LICENSE_ISSUED,
      OrderStatus.DELIVERED,
      OrderStatus.REFUNDED,
    ];

    if (!paidStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: { code: 'PAYMENT_REQUIRED', message: 'Invoice is available only for completed orders.' } },
        { status: 400 }
      );
    }

    const paymentId = order.payments[0]?.providerPaymentId || 'Online Payment (Verified)';

    const invoice = generateTaxInvoice({
      orderId: order.id,
      orderToken: order.publicToken,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      productName: order.product.name,
      amountMinor: order.amountMinor,
      currency: order.currency,
      paymentId,
      createdAt: order.createdAt,
    });

    return new NextResponse(new Uint8Array(invoice.pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'private, no-transform, max-age=3600',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INVOICE_GENERATION_FAILED', message: err?.message || 'Failed to generate invoice.' } },
      { status: 500 }
    );
  }
}
