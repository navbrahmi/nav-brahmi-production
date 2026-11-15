import crypto from 'crypto';
import { prisma } from './prisma';
import { OrderStatus, PaymentStatus, LicenseStatus, EmailOutboxStatus } from '@prisma/client';
import { generateSecureLicenseKey } from './license';
import { encryptLicenseKey } from './license-crypto';
import { assertValidOrderTransition } from './order-state';
import { recordAuditEvent } from './audit';
import { logger } from './logger';

export interface MarkOrderPaidParams {
  orderId?: string;
  orderToken?: string;
  providerOrderId?: string;
  providerPaymentId: string;
  amountMinor: number;
  currency: string;
  rawStatus?: string;
  actorType?: 'SYSTEM' | 'CUSTOMER' | 'ANONYMOUS';
  actorId?: string;
}

export interface MarkOrderPaidResult {
  success: boolean;
  orderId: string;
  orderStatus: OrderStatus;
  isDuplicate: boolean;
  licenseId?: string;
  reason?: string;
}

/**
 * Single, transactional, idempotent payment completion function.
 * Called by:
 * 1. Checkout signature verification (/api/checkout/verify)
 * 2. Razorpay webhook handler (/api/payments/webhook)
 * 3. Scheduled reconciliation (/api/cron/reconcile)
 *
 * Guarantees:
 * - Validates amount and currency against database order.
 * - Concurrency-safe: duplicate/parallel calls cannot issue multiple licenses.
 * - Idempotent: returns existing license if already paid.
 * - On mismatch: records PAYMENT_MISMATCH and audit event; NEVER issues a license.
 */
export async function markOrderPaid(
  params: MarkOrderPaidParams
): Promise<MarkOrderPaidResult> {
  const {
    orderId,
    orderToken,
    providerOrderId,
    providerPaymentId,
    amountMinor,
    currency,
    rawStatus = 'captured',
    actorType = 'SYSTEM',
    actorId,
  } = params;

  let createdLicenseId: string | undefined;
  let targetCustomerEmail: string | undefined;

  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Locate Target Order ID
      let targetOrderId = orderId;
      if (!targetOrderId && orderToken) {
        const found = await tx.order.findUnique({
          where: { publicToken: orderToken },
          select: { id: true },
        });
        targetOrderId = found?.id;
      } else if (!targetOrderId && providerOrderId) {
        const paymentWithOrder = await tx.payment.findFirst({
          where: { providerOrderId },
          select: { orderId: true },
        });
        targetOrderId = paymentWithOrder?.orderId;
      }

      if (!targetOrderId) {
        throw new Error(
          `Order not found for payment completion (orderId: ${orderId}, token: ${orderToken}, providerOrderId: ${providerOrderId})`
        );
      }

      // Concurrency defense: acquire exclusive row lock on the Order
      await tx.$executeRaw`SELECT id FROM "Order" WHERE id = ${targetOrderId} FOR UPDATE`;

      // Read fresh order state and licenses under the exclusive lock
      const lockedOrder = await tx.order.findUniqueOrThrow({
        where: { id: targetOrderId },
        include: { licenses: true, payments: true, product: true },
      });

      // 2. Validate Amount and Currency
    const expectedAmount = lockedOrder.amountMinor;
    const expectedCurrency = lockedOrder.currency.toUpperCase();
    const receivedAmount = amountMinor;
    const receivedCurrency = currency.toUpperCase();

    if (expectedAmount !== receivedAmount || expectedCurrency !== receivedCurrency) {
      logger.warn('Payment amount or currency mismatch detected', {
        orderId: lockedOrder.id,
        expectedAmount,
        receivedAmount,
        expectedCurrency,
        receivedCurrency,
      });

      await tx.order.update({
        where: { id: lockedOrder.id },
        data: { status: OrderStatus.PAYMENT_MISMATCH },
      });

      await tx.payment.upsert({
        where: {
          provider_providerPaymentId: {
            provider: 'RAZORPAY',
            providerPaymentId,
          },
        },
        create: {
          orderId: lockedOrder.id,
          provider: 'RAZORPAY',
          providerPaymentId,
          providerOrderId: providerOrderId || null,
          status: PaymentStatus.FAILED,
          amountMinor: receivedAmount,
          currency: receivedCurrency,
          rawStatus: 'AMOUNT_OR_CURRENCY_MISMATCH',
        },
        update: {
          status: PaymentStatus.FAILED,
          rawStatus: 'AMOUNT_OR_CURRENCY_MISMATCH',
        },
      });

      await recordAuditEvent({
        type: 'PAYMENT_AMOUNT_MISMATCH',
        actorType,
        actorId,
        refType: 'ORDER',
        refId: lockedOrder.id,
        metadata: {
          expectedAmount,
          receivedAmount,
          expectedCurrency,
          receivedCurrency,
          providerPaymentId,
        },
      });

      return {
        success: false,
        orderId: lockedOrder.id,
        orderStatus: OrderStatus.PAYMENT_MISMATCH,
        isDuplicate: false,
        reason: 'Payment amount or currency did not match the order record.',
      };
    }

    // 3. Check for Existing Completed State (Idempotency check)
    const existingActiveLicense = lockedOrder.licenses.find(
      (l) => l.status === LicenseStatus.ACTIVE
    );

    if (
      (lockedOrder.status === OrderStatus.PAID ||
        lockedOrder.status === OrderStatus.LICENSE_ISSUED ||
        lockedOrder.status === OrderStatus.DELIVERED) &&
      existingActiveLicense
    ) {
      // Ensure payment record exists
      await tx.payment.upsert({
        where: {
          provider_providerPaymentId: {
            provider: 'RAZORPAY',
            providerPaymentId,
          },
        },
        create: {
          orderId: lockedOrder.id,
          provider: 'RAZORPAY',
          providerPaymentId,
          providerOrderId: providerOrderId || null,
          status: PaymentStatus.CAPTURED,
          amountMinor: receivedAmount,
          currency: receivedCurrency,
          rawStatus,
          verifiedAt: new Date(),
        },
        update: {
          status: PaymentStatus.CAPTURED,
          rawStatus,
          verifiedAt: new Date(),
        },
      });

      return {
        success: true,
        orderId: lockedOrder.id,
        orderStatus: lockedOrder.status,
        isDuplicate: true,
        licenseId: existingActiveLicense.id,
      };
    }

    // 4. Validate State Machine Transition
    assertValidOrderTransition(lockedOrder.status, OrderStatus.PAID);

    // 5. Upsert Payment Record
    await tx.payment.upsert({
      where: {
        provider_providerPaymentId: {
          provider: 'RAZORPAY',
          providerPaymentId,
        },
      },
      create: {
        orderId: lockedOrder.id,
        provider: 'RAZORPAY',
        providerPaymentId,
        providerOrderId: providerOrderId || null,
        status: PaymentStatus.CAPTURED,
        amountMinor: receivedAmount,
        currency: receivedCurrency,
        rawStatus,
        verifiedAt: new Date(),
      },
      update: {
        status: PaymentStatus.CAPTURED,
        rawStatus,
        verifiedAt: new Date(),
      },
    });

    // 6. Generate Cryptographically Secure License Key with Authenticated Encryption at Rest (AES-256-GCM)
    const licenseKey = generateSecureLicenseKey();
    const keyLookupHash = crypto
      .createHash('sha256')
      .update(licenseKey)
      .digest('hex');

    const encrypted = encryptLicenseKey(licenseKey);

    const license = await tx.license.create({
      data: {
        orderId: lockedOrder.id,
        productId: lockedOrder.productId,
        email: lockedOrder.customerEmail.toLowerCase().trim(),
        keyLookupHash,
        encryptedKey: encrypted.encryptedKey,
        keyIv: encrypted.keyIv,
        keyTag: encrypted.keyTag,
        keyVersion: encrypted.keyVersion,
        maxActivations: 1, // Explicitly confirmed rule: one active machine per license
        status: LicenseStatus.ACTIVE,
      },
    });

    createdLicenseId = license.id;
    targetCustomerEmail = lockedOrder.customerEmail.toLowerCase().trim();

    // 7. Advance Order to LICENSE_ISSUED
    await tx.order.update({
      where: { id: lockedOrder.id },
      data: { status: OrderStatus.LICENSE_ISSUED },
    });

    // 8. Queue Email in EmailOutbox inside transaction
    try {
      await tx.emailOutbox.create({
        data: {
          kind: 'LICENSE_DELIVERY',
          toEmail: targetCustomerEmail,
          payloadRef: license.id,
          status: EmailOutboxStatus.PENDING,
        },
      });
    } catch (outboxErr: any) {
      logger.warn('Email outbox insert within tx skipped or deferred', { error: outboxErr.message });
    }

    return {
      success: true,
      orderId: lockedOrder.id,
      orderStatus: OrderStatus.LICENSE_ISSUED,
      isDuplicate: false,
      licenseId: license.id,
    };
  },
  {
    maxWait: 15000,
    timeout: 30000,
  });

  // Post-commit: Ensure Email Outbox entry exists and log immutable audit events
  if (result.success && createdLicenseId && targetCustomerEmail) {
    try {
      const existingOutbox = await prisma.emailOutbox.findFirst({
        where: { payloadRef: createdLicenseId },
      });
      if (!existingOutbox) {
        await prisma.emailOutbox.create({
          data: {
            kind: 'LICENSE_DELIVERY',
            toEmail: targetCustomerEmail,
            payloadRef: createdLicenseId,
            status: EmailOutboxStatus.PENDING,
          },
        });
      }
    } catch (postOutboxErr: any) {
      logger.warn('Post-commit email outbox check notice', { error: postOutboxErr.message });
    }

    await recordAuditEvent({
      type: 'PAYMENT_CAPTURED',
      actorType,
      actorId,
      refType: 'PAYMENT',
      refId: providerPaymentId,
      metadata: {
        orderId: result.orderId,
        amountMinor,
        currency,
      },
    });

    await recordAuditEvent({
      type: 'LICENSE_ISSUED',
      actorType,
      actorId,
      refType: 'LICENSE',
      refId: createdLicenseId,
      metadata: {
        orderId: result.orderId,
      },
    });
  }

  return result;
}
