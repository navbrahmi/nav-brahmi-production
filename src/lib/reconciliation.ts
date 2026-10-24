import { prisma } from './prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { markOrderPaid } from './payment-completion';
import { getRazorpayConfig } from './razorpay';
import { recordAuditEvent } from './audit';
import { logger } from './logger';

export interface ReconciliationResult {
  examined: number;
  reconciled: number;
  unresolved: number;
  errors: Array<{ orderId: string; error: string }>;
}

/**
 * Reconciles orders stuck in pending or partial-failure states.
 * Operates safely and idempotently without duplicate license issuance.
 */
export async function reconcileOrders(options?: {
  olderThanMinutes?: number;
}): Promise<ReconciliationResult> {
  const olderThanMinutes = options?.olderThanMinutes ?? 15;
  const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

  const result: ReconciliationResult = {
    examined: 0,
    reconciled: 0,
    unresolved: 0,
    errors: [],
  };

  // 1. Recover orders marked PAID or NEEDS_ATTENTION that are missing active licenses
  const ordersMissingLicense = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.PAID, OrderStatus.NEEDS_ATTENTION] },
      licenses: { none: { status: 'ACTIVE' } },
    },
    include: { payments: true, licenses: true, product: true },
  });

  for (const order of ordersMissingLicense) {
    result.examined++;
    try {
      const capturedPayment = order.payments.find(
        (p) => p.status === PaymentStatus.CAPTURED && p.providerPaymentId
      );

      if (capturedPayment && capturedPayment.providerPaymentId) {
        logger.info('Reconciliation recovering license for paid order', {
          orderId: order.id,
          paymentId: capturedPayment.providerPaymentId,
        });

        await markOrderPaid({
          orderId: order.id,
          providerOrderId: capturedPayment.providerOrderId || undefined,
          providerPaymentId: capturedPayment.providerPaymentId,
          amountMinor: capturedPayment.amountMinor,
          currency: capturedPayment.currency,
          actorType: 'SYSTEM',
          actorId: 'reconciler',
        });

        result.reconciled++;
        await recordAuditEvent({
          type: 'RECONCILIATION_ORDER_RECOVERED',
          actorType: 'SYSTEM',
          refType: 'ORDER',
          refId: order.id,
          metadata: { paymentId: capturedPayment.providerPaymentId },
        });
      } else {
        result.unresolved++;
      }
    } catch (err: any) {
      result.errors.push({ orderId: order.id, error: err.message });
      logger.error('Failed to reconcile order missing license', {
        orderId: order.id,
        error: err.message,
      });
    }
  }

  // 2. Check PAYMENT_PENDING orders older than cutoff with payment gateway if configured
  const config = getRazorpayConfig();
  if (config) {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.PAYMENT_PENDING,
        createdAt: { lte: cutoffTime },
      },
      include: { payments: true },
      take: 20,
    });

    for (const order of pendingOrders) {
      result.examined++;
      try {
        const paymentWithProviderOrder = order.payments.find(
          (p) => p.providerOrderId
        );

        if (!paymentWithProviderOrder?.providerOrderId) {
          result.unresolved++;
          continue;
        }

        const providerOrderId = paymentWithProviderOrder.providerOrderId;
        const authHeader = `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`;

        const res = await fetch(
          `https://api.razorpay.com/v1/orders/${providerOrderId}/payments`,
          {
            headers: { Authorization: authHeader },
          }
        );

        if (!res.ok) {
          result.unresolved++;
          continue;
        }

        const data = await res.json();
        const paymentsList: any[] = data.items || [];
        const captured = paymentsList.find(
          (p: any) => p.status === 'captured'
        );

        if (captured) {
          logger.info('Reconciliation detected captured payment at gateway for pending order', {
            orderId: order.id,
            paymentId: captured.id,
          });

          await markOrderPaid({
            orderId: order.id,
            providerOrderId,
            providerPaymentId: captured.id,
            amountMinor: captured.amount,
            currency: captured.currency,
            actorType: 'SYSTEM',
            actorId: 'reconciler',
          });

          result.reconciled++;
        } else {
          result.unresolved++;
        }
      } catch (err: any) {
        result.errors.push({ orderId: order.id, error: err.message });
      }
    }
  }

  return result;
}
