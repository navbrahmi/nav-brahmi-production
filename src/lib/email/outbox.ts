import { prisma } from '../prisma';
import { EmailOutboxStatus, OrderStatus } from '@prisma/client';
import { getEmailTransport, EmailTransport } from './transport';
import { renderLicenseDeliveryEmail } from './templates';
import { decryptLicenseKey } from '../license-crypto';
import { createPurchaseAuthToken } from '../license';
import { logger } from '../logger';
import { recordAuditEvent } from '../audit';
import { generateTaxInvoice } from '../invoice';

export interface ProcessOutboxOptions {
  transport?: EmailTransport;
  limit?: number;
}

export interface ProcessOutboxResult {
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{ outboxId: string; error: string }>;
}

/**
 * Dispatches a single outbox item immediately using the provided or default email transport.
 */
export async function dispatchSingleOutboxItem(
  item: any,
  transport: EmailTransport = getEmailTransport(),
  appBaseUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let resolvedBaseUrl = appBaseUrl;
  if (!resolvedBaseUrl) {
    resolvedBaseUrl =
      process.env.APP_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      'https://dev.brahmicomputing.in';

    if (resolvedBaseUrl.includes('localhost')) {
      resolvedBaseUrl = process.env.NODE_ENV === 'production'
        ? 'https://brahmicomputing.in'
        : 'https://dev.brahmicomputing.in';
    }
  }

  try {
    if ((item.kind === 'LICENSE_DELIVERY' || item.kind === 'LICENSE_RECOVERY') && item.payloadRef) {
      // Resolve license details
      const license = await prisma.license.findUnique({
        where: { id: item.payloadRef },
        include: {
          product: true,
          order: {
            include: {
              payments: {
                where: { status: 'CAPTURED' },
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      if (!license) {
        logger.error('EmailOutbox record refers to non-existent license', {
          outboxId: item.id,
          licenseId: item.payloadRef,
        });

        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: { status: EmailOutboxStatus.FAILED },
        });

        return {
          success: false,
          error: `License ${item.payloadRef} not found in database.`,
        };
      }

      // Decrypt license key in memory; never log decrypted key
      const decryptedKey = decryptLicenseKey(license);
      const resolvedKey = decryptedKey || '[Legacy Unrecoverable Key - Contact Support]';
      const downloadUrl = license.order?.publicToken
        ? `${resolvedBaseUrl}/orders/${encodeURIComponent(license.order.publicToken)}`
        : `${resolvedBaseUrl}/instructions`;

      let emailContent: { subject: string; text: string; html: string };
      if (item.kind === 'LICENSE_RECOVERY') {
        const subject = `[Nav Brahmi] Recovered License Key for ${license.product.name}`;
        const text = decryptedKey
          ? `Hello,\n\nHere are your recovered software license details for ${license.product.name}:\n\nLicense Key: ${decryptedKey}\n\nInstallation Guide: ${resolvedBaseUrl}/instructions\nInstaller Download: ${downloadUrl}\n\nExisting machine activations remain active.\n\nNav Brahmi Computing Technologies\nhttps://brahmicomputing.in`
          : `Hello,\n\nA purchase was located for ${license.product.name}. However, because your license predates encrypted key storage, please contact support@brahmicomputing.in with your purchase email to retrieve your key.\n\nNav Brahmi Computing Technologies\nhttps://brahmicomputing.in`;
        const html = `<p>${text.replace(/\n/g, '<br>')}</p>`;
        emailContent = { subject, text, html };
      } else {
        emailContent = renderLicenseDeliveryEmail({
          customerName: license.order?.customerName || undefined,
          customerEmail: license.email,
          productName: license.product.name,
          licenseKey: resolvedKey,
          instructionsUrl: `${resolvedBaseUrl}/instructions`,
          downloadUrl,
          orderToken: license.order?.publicToken || license.id,
        });
      }

      let attachments: Array<{ filename: string; content: Buffer; contentType: string }> | undefined;
      if (item.kind === 'LICENSE_DELIVERY' && license.order) {
        try {
          const invoice = generateTaxInvoice({
            orderId: license.order.id,
            orderToken: license.order.publicToken,
            customerName: license.order.customerName,
            customerEmail: license.email,
            productName: license.product.name,
            amountMinor: license.order.amountMinor,
            currency: license.order.currency,
            paymentId: license.order.payments[0]?.providerPaymentId || null,
            createdAt: license.order.createdAt,
          });
          attachments = [
            {
              filename: `${invoice.invoiceNumber}.pdf`,
              content: invoice.pdfBuffer,
              contentType: 'application/pdf',
            },
          ];
        } catch (invErr: any) {
          logger.warn('Failed to generate invoice attachment for license email', {
            orderId: license.order.id,
            error: invErr?.message || invErr,
          });
        }
      }

      const sendResult = await transport.sendMail({
        to: item.toEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        attachments,
      });

      if (sendResult.success) {
        try {
          await prisma.emailOutbox.update({
            where: { id: item.id },
            data: {
              status: EmailOutboxStatus.SENT,
              sentAt: new Date(),
            },
          });

          // If order was LICENSE_ISSUED, advance to DELIVERED
          if (license.order && license.order.status === OrderStatus.LICENSE_ISSUED) {
            await prisma.order.update({
              where: { id: license.order.id },
              data: { status: OrderStatus.DELIVERED },
            });
          }
        } catch (updateErr: any) {
          logger.warn('Email sent but status update notice', { error: updateErr?.message });
        }

        await recordAuditEvent({
          type: 'EMAIL_DELIVERED',
          actorType: 'SYSTEM',
          refType: 'LICENSE',
          refId: license.id,
          metadata: {
            outboxId: item.id,
            kind: item.kind,
            messageId: sendResult.messageId,
          },
        });

        return { success: true, messageId: sendResult.messageId };
      } else {
        const nextAttempt = item.attempts + 1;
        const isTerminal = nextAttempt >= 5;
        const backoffMinutes = Math.pow(2, nextAttempt);
        const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            attempts: nextAttempt,
            status: isTerminal ? EmailOutboxStatus.FAILED : EmailOutboxStatus.PENDING,
            nextAttemptAt: isTerminal ? item.nextAttemptAt : nextAttemptAt,
          },
        });

        logger.warn('Email dispatch failed, scheduled for retry', {
          outboxId: item.id,
          attempt: nextAttempt,
          isTerminal,
          error: sendResult.error,
        });

        return {
          success: false,
          error: sendResult.error || 'Unknown send failure',
        };
      }
    } else if (item.kind === 'SUPPORT_NOTIFICATION') {
      let subject = '[Nav Brahmi Support] New Support Notification';
      let text = 'A new support event requires attention.';
      let html = '<p>A new support event requires attention.</p>';

      if (item.payloadRef) {
        const refundRequest = await prisma.refundRequest.findUnique({
          where: { id: item.payloadRef },
          include: {
            order: {
              include: {
                product: true,
              },
            },
          },
        });

        if (refundRequest) {
          subject = `[Nav Brahmi Support] Refund Review Request: Order ${refundRequest.order.publicToken}`;
          text =
            `Hello Support Team,\n\nA customer has submitted a refund or technical review request:\n\n` +
            `Request ID: ${refundRequest.id}\n` +
            `Order Reference: ${refundRequest.order.publicToken}\n` +
            `Product: ${refundRequest.order.product?.name || 'N/A'} (${refundRequest.order.product?.code || 'N/A'})\n` +
            `Customer Email: ${refundRequest.customerEmail}\n` +
            `Reason: ${refundRequest.reason}\n` +
            `Details: ${refundRequest.supportingInfo || 'None provided'}\n` +
            `Installation Timestamp: ${refundRequest.installationAt ? refundRequest.installationAt.toISOString() : 'None recorded'}\n` +
            `Status: ${refundRequest.status}\n` +
            `Submitted: ${refundRequest.requestedAt.toISOString()}\n\n` +
            `Nav Brahmi Automated Support System\n${resolvedBaseUrl}`;

          html =
            `<!DOCTYPE html><html><body style="font-family: sans-serif; line-height: 1.5; color: #231F20;">` +
            `<h2 style="color: #E51055;">Customer Support Review Request</h2>` +
            `<ul>` +
            `<li><strong>Request ID:</strong> ${refundRequest.id}</li>` +
            `<li><strong>Order Token:</strong> <code>${refundRequest.order.publicToken}</code></li>` +
            `<li><strong>Product:</strong> ${refundRequest.order.product?.name || 'N/A'}</li>` +
            `<li><strong>Customer Email:</strong> ${refundRequest.customerEmail}</li>` +
            `<li><strong>Reason:</strong> ${refundRequest.reason}</li>` +
            `<li><strong>Details:</strong> ${refundRequest.supportingInfo || 'None provided'}</li>` +
            `<li><strong>Installation Timestamp:</strong> ${refundRequest.installationAt ? refundRequest.installationAt.toISOString() : 'None recorded'}</li>` +
            `<li><strong>Status:</strong> ${refundRequest.status}</li>` +
            `<li><strong>Submitted:</strong> ${refundRequest.requestedAt.toISOString()}</li>` +
            `</ul></body></html>`;
        }
      }

      const sendResult = await transport.sendMail({
        to: item.toEmail,
        subject,
        text,
        html,
      });

      if (sendResult.success) {
        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            status: EmailOutboxStatus.SENT,
            sentAt: new Date(),
          },
        });

        await recordAuditEvent({
          type: 'SUPPORT_NOTIFICATION_SENT',
          actorType: 'SYSTEM',
          refType: 'ORDER',
          refId: item.payloadRef || item.id,
          metadata: {
            outboxId: item.id,
            kind: item.kind,
            to: item.toEmail,
            messageId: sendResult.messageId,
          },
        });

        return { success: true, messageId: sendResult.messageId };
      } else {
        const nextAttempt = item.attempts + 1;
        const isTerminal = nextAttempt >= 5;
        const backoffMinutes = Math.pow(2, nextAttempt);
        const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            attempts: nextAttempt,
            status: isTerminal ? EmailOutboxStatus.FAILED : EmailOutboxStatus.PENDING,
            nextAttemptAt: isTerminal ? item.nextAttemptAt : nextAttemptAt,
          },
        });

        logger.warn('Support notification dispatch failed, scheduled for retry', {
          outboxId: item.id,
          attempt: nextAttempt,
          isTerminal,
          error: sendResult.error,
        });

        return {
          success: false,
          error: sendResult.error || 'Unknown send failure',
        };
      }
    } else {
      logger.warn('Unhandled EmailOutbox kind encountered', {
        outboxId: item.id,
        kind: item.kind,
      });
      await prisma.emailOutbox.update({
        where: { id: item.id },
        data: { status: EmailOutboxStatus.FAILED },
      });
      return { success: false, error: `Unhandled email kind: ${item.kind}` };
    }
  } catch (err: any) {
    logger.error('Unexpected error processing outbox item', {
      outboxId: item.id,
      error: err.message,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Sends a specific outbox item immediately without waiting for cron.
 */
export async function sendOutboxItemImmediately(
  outboxId: string,
  options: { transport?: EmailTransport } = {}
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const item = await prisma.emailOutbox.findUnique({
    where: { id: outboxId },
  });

  if (!item) {
    return { success: false, error: 'Outbox record not found' };
  }

  const transport = options.transport || getEmailTransport();
  return await dispatchSingleOutboxItem(item, transport);
}

/**
 * Processes queued emails in the EmailOutbox with exponential backoff and retry.
 */
export async function processEmailOutbox(
  options: ProcessOutboxOptions = {}
): Promise<ProcessOutboxResult> {
  const transport = options.transport || getEmailTransport();
  const limit = options.limit || 10;
  const now = new Date();

  // Find due pending messages
  const pendingItems = await prisma.emailOutbox.findMany({
    where: {
      status: EmailOutboxStatus.PENDING,
      nextAttemptAt: { lte: now },
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  const result: ProcessOutboxResult = {
    processed: pendingItems.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  let appBaseUrl =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'https://dev.brahmicomputing.in';

  if (appBaseUrl.includes('localhost')) {
    appBaseUrl = process.env.NODE_ENV === 'production'
      ? 'https://brahmicomputing.in'
      : 'https://dev.brahmicomputing.in';
  }

  for (const item of pendingItems) {
    const outcome = await dispatchSingleOutboxItem(item, transport, appBaseUrl);
    if (outcome.success) {
      result.sent++;
    } else {
      result.failed++;
      result.errors.push({
        outboxId: item.id,
        error: outcome.error || 'Unknown send failure',
      });
    }
  }

  return result;
}

export interface QueueEmailInput {
  kind: string;
  toEmail: string;
  payloadRef?: string | null;
}

/**
 * Enqueues an outgoing email to the EmailOutbox for reliable asynchronous delivery.
 */
export async function queueOutboxEmail(input: QueueEmailInput) {
  return await prisma.emailOutbox.create({
    data: {
      kind: input.kind,
      toEmail: input.toEmail.toLowerCase().trim(),
      payloadRef: input.payloadRef || null,
      status: EmailOutboxStatus.PENDING,
    },
  });
}
