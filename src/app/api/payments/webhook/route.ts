import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { markOrderPaid } from '@/lib/payment-completion';
import { OrderStatus } from '@prisma/client';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Unable to read request payload' }, { status: 400 });
  }

  const signature =
    req.headers.get('x-razorpay-signature') || req.headers.get('X-Razorpay-Signature');
  const eventId =
    req.headers.get('x-razorpay-event-id') || req.headers.get('X-Razorpay-Event-Id');

  if (!signature) {
    logger.warn('Webhook received without X-Razorpay-Signature header');
    return NextResponse.json({ error: 'Missing X-Razorpay-Signature header' }, { status: 400 });
  }

  // 1. Verify Webhook Signature with Raw Body (Timing-Safe)
  const isValid = verifyWebhookSignature({ rawBody, signature });
  if (!isValid) {
    logger.warn('Invalid Razorpay webhook signature', { eventId });
    await recordAuditEvent({
      type: 'WEBHOOK_INVALID_SIGNATURE',
      actorType: 'ANONYMOUS',
      refType: 'WEBHOOK',
      metadata: { eventId },
    });
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  // 2. Parse Event JSON
  let eventPayload: any;
  try {
    eventPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
  }

  const eventType: string = eventPayload.event || 'unknown';
  const effectiveEventId = eventId || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // 3. Deduplication via Unique Provider Event ID Constraint
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: 'RAZORPAY',
        providerEventId: effectiveEventId,
        type: eventType,
        payload: eventPayload,
      },
    });
  } catch (err: any) {
    // Prisma unique constraint violation code is P2002
    if (err.code === 'P2002') {
      logger.info('Duplicate webhook event received; returning idempotent 200 OK', {
        eventId: effectiveEventId,
        eventType,
      });
      return NextResponse.json(
        { received: true, duplicate: true, message: 'Event already processed' },
        { status: 200 }
      );
    }
    throw err;
  }

  // 4. Handle Specific Event Types
  try {
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      if (!paymentEntity) {
        logger.warn('Payment entity missing from payment event payload', { eventType });
        return NextResponse.json({ received: true, warning: 'Missing entity' }, { status: 200 });
      }

      const providerPaymentId = paymentEntity.id;
      const providerOrderId = paymentEntity.order_id;
      const amountMinor = paymentEntity.amount;
      const currency = paymentEntity.currency;

      logger.info('Processing payment webhook event', {
        eventType,
        providerPaymentId,
        providerOrderId,
        amountMinor,
      });

      const completionResult = await markOrderPaid({
        providerOrderId,
        providerPaymentId,
        amountMinor,
        currency,
        rawStatus: paymentEntity.status || 'captured',
        actorType: 'SYSTEM',
        actorId: 'razorpay_webhook',
      });

      await prisma.webhookEvent.update({
        where: { providerEventId: effectiveEventId },
        data: {
          processedAt: new Date(),
          orderId: completionResult.orderId,
        },
      });

      return NextResponse.json({
        received: true,
        orderId: completionResult.orderId,
        orderStatus: completionResult.orderStatus,
        isDuplicate: completionResult.isDuplicate,
      });
    }

    if (eventType === 'payment.failed') {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      const providerOrderId = paymentEntity?.order_id;
      const providerPaymentId = paymentEntity?.id;

      if (providerOrderId) {
        const paymentRecord = await prisma.payment.findFirst({
          where: { providerOrderId },
          include: { order: true },
        });

        if (paymentRecord?.order) {
          await prisma.order.update({
            where: { id: paymentRecord.order.id },
            data: { status: OrderStatus.FAILED },
          });

          await recordAuditEvent({
            type: 'PAYMENT_FAILED_EVENT',
            actorType: 'SYSTEM',
            refType: 'ORDER',
            refId: paymentRecord.order.id,
            metadata: {
              providerPaymentId,
              providerOrderId,
              errorCode: paymentEntity?.error_code,
              errorDescription: paymentEntity?.error_description,
            },
          });
        }
      }

      return NextResponse.json({ received: true, handled: 'payment.failed' });
    }

    if (
      eventType.startsWith('refund.') ||
      eventType.startsWith('dispute.')
    ) {
      logger.warn('Refund or dispute webhook event received', {
        eventType,
        eventId: effectiveEventId,
      });

      const paymentEntity = eventPayload.payload?.payment?.entity;
      const providerOrderId = paymentEntity?.order_id;

      if (providerOrderId) {
        const paymentRecord = await prisma.payment.findFirst({
          where: { providerOrderId },
          include: { order: true },
        });

        if (paymentRecord?.order) {
          // Flag as NEEDS_ATTENTION without auto-revoking (adheres to C-08 pending policy decision)
          await prisma.order.update({
            where: { id: paymentRecord.order.id },
            data: { status: OrderStatus.NEEDS_ATTENTION },
          });

          await recordAuditEvent({
            type: `GATEWAY_${eventType.toUpperCase()}`,
            actorType: 'SYSTEM',
            refType: 'ORDER',
            refId: paymentRecord.order.id,
            metadata: { eventType, eventId: effectiveEventId },
          });
        }
      }

      return NextResponse.json({ received: true, handled: eventType });
    }

    // Default: acknowledge other non-actionable events
    logger.info('Ignoring non-actionable webhook event', { eventType });
    return NextResponse.json({ received: true, ignored: true, eventType });
  } catch (err: any) {
    logger.error('Error handling webhook event body', {
      eventType,
      error: err.message,
    });
    // Return 500 for retryable system failures so Razorpay retries
    return NextResponse.json(
      { error: 'Internal failure processing webhook' },
      { status: 500 }
    );
  }
}
