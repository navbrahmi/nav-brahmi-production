import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { decryptLicenseKey } from '@/lib/license-crypto';
import { queueOutboxEmail, sendOutboxItemImmediately } from '@/lib/email/outbox';
import { markOrderPaid } from '@/lib/payment-completion';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const status = searchParams.get('status') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { customerEmail: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { id: { contains: q, mode: 'insensitive' } },
      { publicToken: { contains: q, mode: 'insensitive' } },
      { payments: { some: { providerPaymentId: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  const [totalCount, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, code: true, slug: true } },
        payments: {
          select: { id: true, provider: true, providerPaymentId: true, providerOrderId: true, status: true, amountMinor: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        licenses: {
          select: {
            id: true,
            status: true,
            licenseKey: true,
            encryptedKey: true,
            keyIv: true,
            keyTag: true,
            resetCount: true,
            installedAt: true,
            createdAt: true,
            activations: {
              select: { machineIdHash: true, status: true, lastSeenAt: true },
            },
          },
        },
        refundRequests: {
          select: { id: true, status: true, reason: true, requestedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
  ]);

  const sanitizedOrders = orders.map((o) => {
    const activeLicense = o.licenses[0];
    let resolvedLicenseKey = null;
    if (activeLicense) {
      resolvedLicenseKey = decryptLicenseKey(activeLicense) || activeLicense.licenseKey;
    }

    return {
      id: o.id,
      publicToken: o.publicToken,
      customerEmail: o.customerEmail,
      customerName: o.customerName,
      amountMinor: o.amountMinor,
      amountINR: o.amountMinor / 100,
      currency: o.currency,
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      product: o.product,
      payments: o.payments,
      license: activeLicense
        ? {
            id: activeLicense.id,
            status: activeLicense.status,
            licenseKey: resolvedLicenseKey,
            activationsCount: activeLicense.activations.length,
            activations: activeLicense.activations,
            resetCount: activeLicense.resetCount,
            installedAt: activeLicense.installedAt,
          }
        : null,
      licenses: activeLicense
        ? [
            {
              id: activeLicense.id,
              status: activeLicense.status,
              licenseKey: resolvedLicenseKey,
              activationsCount: activeLicense.activations.length,
              activations: activeLicense.activations,
              resetCount: activeLicense.resetCount,
              installedAt: activeLicense.installedAt,
            },
          ]
        : [],
      refundRequest: o.refundRequests[0] || null,
    };
  });

  return NextResponse.json({
    success: true,
    total: totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    orders: sanitizedOrders,
  });
}

export async function POST(req: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, licenses: true, payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'resend_email') {
      const activeLicense = order.licenses[0];
      if (!activeLicense) {
        return NextResponse.json({ error: 'No license exists for this order to email.' }, { status: 400 });
      }

      const outbox = await queueOutboxEmail({
        kind: 'LICENSE_DELIVERY',
        toEmail: order.customerEmail,
        payloadRef: activeLicense.id,
      });

      const sendResult = await sendOutboxItemImmediately(outbox.id);

      await recordAuditEvent({
        type: 'LICENSE_EMAIL_RESENT_BY_ADMIN',
        actorType: 'ADMIN',
        refType: 'ORDER',
        refId: order.id,
        metadata: {
          customerEmail: order.customerEmail,
          outboxId: outbox.id,
          sendResult,
        },
      });

      if (!sendResult.success) {
        return NextResponse.json(
          { error: `Immediate email send failed: ${sendResult.error || 'Gateway rejected'}` },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `License delivery email sent immediately to ${order.customerEmail}`,
      });
    }

    if (action === 'reconcile_order') {
      // Reconciles order to PAID and issues license if stuck
      const latestPayment = order.payments[0];
      const paymentId = latestPayment?.providerPaymentId || `manual_${Date.now()}`;

      const result = await markOrderPaid({
        orderId: order.id,
        providerPaymentId: paymentId,
        rawStatus: 'reconciled_by_admin',
        amountMinor: order.amountMinor,
        currency: order.currency || 'INR',
        actorType: 'ADMIN',
        actorId: 'admin-portal',
      });

      return NextResponse.json({ success: true, message: 'Order reconciled successfully.', result });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
