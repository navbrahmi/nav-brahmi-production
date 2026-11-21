import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { recordAuditEvent } from '@/lib/audit';
import { refundRazorpayPayment } from '@/lib/razorpay';
import { OrderStatus, LicenseStatus, RefundRequestStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const refundRequests = await prisma.refundRequest.findMany({
    include: {
      order: {
        include: {
          product: { select: { id: true, name: true, code: true } },
          payments: { select: { id: true, providerPaymentId: true, status: true, amountMinor: true } },
          licenses: { select: { id: true, status: true } },
        },
      },
    },
    orderBy: { requestedAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    refunds: refundRequests.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      customerEmail: r.customerEmail,
      reason: r.reason,
      supportingInfo: r.supportingInfo,
      status: r.status,
      requestedAt: r.requestedAt,
      reviewedAt: r.reviewedAt,
      reviewedBy: r.reviewedBy,
      reviewNotes: r.reviewNotes,
      installationAt: r.installationAt,
      order: {
        publicToken: r.order.publicToken,
        status: r.order.status,
        amountINR: r.order.amountMinor / 100,
        amountMinor: r.order.amountMinor,
        product: r.order.product,
        paymentId: r.order.payments[0]?.providerPaymentId || null,
        licenseStatus: r.order.licenses[0]?.status || null,
      },
    })),
  });
}

export async function POST(req: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, refundRequestId, reviewNotes } = body;

    if (!refundRequestId) {
      return NextResponse.json({ error: 'refundRequestId is required' }, { status: 400 });
    }

    const refund = await prisma.refundRequest.findUnique({
      where: { id: refundRequestId },
      include: {
        order: {
          include: {
            payments: { where: { status: 'CAPTURED' } },
            licenses: true,
          },
        },
      },
    });

    if (!refund) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // 1. Trigger Razorpay Refund API if payment ID exists
      const capturedPayment = refund.order.payments[0];
      if (capturedPayment?.providerPaymentId) {
        try {
          await refundRazorpayPayment({
            paymentId: capturedPayment.providerPaymentId,
            amountMinor: refund.order.amountMinor,
            notes: {
              refundRequestId: refund.id,
              orderId: refund.orderId,
              reason: refund.reason.slice(0, 50),
            },
          });
        } catch (gatewayErr: any) {
          console.warn('Gateway refund call warning:', gatewayErr.message);
        }
      }

      // 2. Database updates in transaction:
      await prisma.$transaction(async (tx) => {
        // Update RefundRequest status
        await tx.refundRequest.update({
          where: { id: refund.id },
          data: {
            status: RefundRequestStatus.APPROVED,
            reviewedAt: new Date(),
            reviewedBy: 'ADMIN',
            reviewNotes: reviewNotes || 'Approved by administrator.',
          },
        });

        // Update Order status to REFUNDED
        await tx.order.update({
          where: { id: refund.orderId },
          data: {
            status: OrderStatus.REFUNDED,
          },
        });

        // Revoke associated license
        for (const lic of refund.order.licenses) {
          await tx.license.update({
            where: { id: lic.id },
            data: {
              status: LicenseStatus.REVOKED,
              revokedAt: new Date(),
              revokeReason: `Refund approved: ${reviewNotes || refund.reason}`,
            },
          });
        }
      });

      await recordAuditEvent({
        type: 'REFUND_APPROVED_BY_ADMIN',
        actorType: 'ADMIN',
        refType: 'ORDER',
        refId: refund.orderId,
        metadata: {
          refundRequestId: refund.id,
          customerEmail: refund.customerEmail,
          amountMinor: refund.order.amountMinor,
          reviewNotes,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Refund approved. Order marked REFUNDED and license revoked.',
      });
    }

    if (action === 'reject') {
      await prisma.refundRequest.update({
        where: { id: refund.id },
        data: {
          status: RefundRequestStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedBy: 'ADMIN',
          reviewNotes: reviewNotes || 'Rejected by administrator.',
        },
      });

      await recordAuditEvent({
        type: 'REFUND_REJECTED_BY_ADMIN',
        actorType: 'ADMIN',
        refType: 'ORDER',
        refId: refund.orderId,
        metadata: {
          refundRequestId: refund.id,
          customerEmail: refund.customerEmail,
          reviewNotes,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Refund request rejected.',
      });
    }

    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}

