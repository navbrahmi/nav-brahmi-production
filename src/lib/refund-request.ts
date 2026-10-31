import { prisma } from './prisma';
import { recordAuditEvent } from './audit';
import { logger } from './logger';
import { checkRateLimit } from './rate-limiter';
import { queueOutboxEmail } from './email/outbox';

export interface SubmitRefundRequestInput {
  orderToken: string;
  reason: string;
  supportingInfo?: string;
  ip: string;
}

export interface RefundRequestResult {
  success: boolean;
  requestId: string;
  orderToken: string;
  customerEmail: string;
  status: 'PENDING_REVIEW';
  installationTimestamp: string | null;
  message: string;
}

export class RefundRequestError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = 'RefundRequestError';
    this.code = code;
    this.status = status;
  }
}

const REFUND_WINDOW_DAYS = 7;
const REFUND_WINDOW_MS = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Processes customer intake for a software refund request (C-08 & C-18).
 *
 * Enforces:
 * 1. 7 calendar days window measured from server-recorded installation event.
 * 2. Fallback to manual review if installation timestamp is unconfirmed.
 * 3. Rate limiting and duplicate abuse prevention.
 * 4. Stored under PENDING_REVIEW status.
 * 5. Dispatches notification to support team via Resend transport.
 * 6. Audit event logging.
 * 7. ZERO automatic financial refund or license revocation.
 */
export async function submitRefundRequest(
  input: SubmitRefundRequestInput
): Promise<RefundRequestResult> {
  const { orderToken, reason, supportingInfo, ip } = input;

  if (!orderToken?.trim()) {
    throw new RefundRequestError('MISSING_ORDER_TOKEN', 'Order reference is required.', 400);
  }

  const trimmedReason = reason?.trim();
  if (!trimmedReason || trimmedReason.length < 15) {
    throw new RefundRequestError(
      'INSUFFICIENT_REASON',
      'Please describe the serious software defect or significant functional issue experienced (at least 15 characters).',
      400
    );
  }

  // 1. Rate Limiting: max 5 refund request attempts per IP per 10 minutes
  const rateLimit = await checkRateLimit({
    key: 'refund_request',
    ip,
    limit: 5,
    windowSeconds: 600,
  });

  if (!rateLimit.success) {
    throw new RefundRequestError(
      'RATE_LIMIT_EXCEEDED',
      'Too many refund requests submitted from this IP. Please wait before submitting again.',
      429
    );
  }

  // 2. Locate Order by secure publicToken
  const order = await prisma.order.findUnique({
    where: { publicToken: orderToken.trim() },
    include: {
      product: true,
      licenses: {
        include: {
          activations: true,
        },
      },
      refundRequests: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    throw new RefundRequestError('ORDER_NOT_FOUND', 'No matching order found for this reference.', 404);
  }

  // Check valid order states for refund consideration
  const eligibleStatuses = ['PAID', 'LICENSE_ISSUED', 'DELIVERED'];
  if (!eligibleStatuses.includes(order.status)) {
    throw new RefundRequestError(
      'ORDER_NOT_ELIGIBLE',
      `Order status is ${order.status}. Refund requests can only be reviewed for completed orders.`,
      400
    );
  }

  // 3. Duplicate Prevention: Check for existing pending request
  const existingPending = order.refundRequests.find((r) => r.status === 'PENDING_REVIEW');
  if (existingPending) {
    throw new RefundRequestError(
      'DUPLICATE_REQUEST_PENDING',
      'A refund review request for this order is already pending evaluation by our support team.',
      409
    );
  }

  // 4. Resolve Server-Recorded Installation Timestamp
  let serverInstallationTime: Date | null = null;

  // Check license installedAt or activatedAt
  const primaryLicense = order.licenses[0];
  if (primaryLicense?.installedAt) {
    serverInstallationTime = primaryLicense.installedAt;
  } else if (primaryLicense?.activatedAt) {
    serverInstallationTime = primaryLicense.activatedAt;
  } else if (primaryLicense) {
    // Check for audit event indicating installation reported
    const installAudit = await prisma.auditEvent.findFirst({
      where: {
        type: 'INSTALLATION_REPORTED',
        refType: 'LICENSE',
        refId: primaryLicense.id,
      },
      orderBy: { at: 'desc' },
    });
    if (installAudit) {
      serverInstallationTime = installAudit.at;
    }
  }

  // 5. Evaluate 7-day period if installation timestamp is present
  const now = new Date();
  if (serverInstallationTime) {
    const elapsedMs = now.getTime() - serverInstallationTime.getTime();
    if (elapsedMs > REFUND_WINDOW_MS) {
      const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
      throw new RefundRequestError(
        'REFUND_WINDOW_EXPIRED',
        `Refund eligibility expired. Requests must be submitted within 7 calendar days of software installation (installation was ${elapsedDays} days ago).`,
        400
      );
    }
  } else {
    // Client rule: "If a reliable installation timestamp is unavailable, route the request for manual support review rather than automatically rejecting it."
    logger.info('Installation timestamp unavailable for refund request; routing for manual support review', {
      orderId: order.id,
      publicToken: order.publicToken,
    });
  }

  // 6. Create RefundRequest record in database
  const refundRequest = await prisma.refundRequest.create({
    data: {
      orderId: order.id,
      customerEmail: order.customerEmail,
      reason: trimmedReason,
      supportingInfo: supportingInfo?.trim() || null,
      status: 'PENDING_REVIEW',
      installationAt: serverInstallationTime,
      requestedAt: now,
    },
  });

  // 7. Record Security Audit Event
  await recordAuditEvent({
    type: 'REFUND_REQUEST_SUBMITTED',
    actorType: 'CUSTOMER',
    actorId: ip,
    refType: 'ORDER',
    refId: order.id,
    metadata: {
      refundRequestId: refundRequest.id,
      orderToken: order.publicToken,
      hasInstallationTimestamp: !!serverInstallationTime,
      installationAt: serverInstallationTime?.toISOString() || null,
    },
  });

  // 8. Queue Support Notification Email via EmailOutbox (Resend Transport)
  try {
    await queueOutboxEmail({
      kind: 'SUPPORT_NOTIFICATION',
      toEmail: 'support@brahmicomputing.in',
      payloadRef: refundRequest.id,
    });
  } catch (err: any) {
    logger.warn('Failed to queue support email notification for refund request', {
      error: err.message,
      refundRequestId: refundRequest.id,
    });
  }

  logger.info('Refund request recorded under PENDING_REVIEW', {
    refundRequestId: refundRequest.id,
    orderId: order.id,
  });

  return {
    success: true,
    requestId: refundRequest.id,
    orderToken: order.publicToken,
    customerEmail: order.customerEmail,
    status: 'PENDING_REVIEW',
    installationTimestamp: serverInstallationTime ? serverInstallationTime.toISOString() : null,
    message:
      'Your refund request has been received and routed for manual support review. A representative will inspect your report and contact you at your purchase email address.',
  };
}
