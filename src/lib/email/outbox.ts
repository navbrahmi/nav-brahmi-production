import { prisma } from '../prisma';
import { EmailOutboxStatus, OrderStatus } from '@prisma/client';
import { getEmailTransport, EmailTransport } from './transport';
import { renderLicenseDeliveryEmail } from './templates';
import { decryptLicenseKey } from '../license-crypto';
import { createPurchaseAuthToken } from '../license';
import { logger } from '../logger';
import { recordAuditEvent } from '../audit';

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

  const appBaseUrl =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'https://brahmicomputing.in';

  for (const item of pendingItems) {
    try {
      if ((item.kind === 'LICENSE_DELIVERY' || item.kind === 'LICENSE_RECOVERY') && item.payloadRef) {
        // Resolve license details
        const license = await prisma.license.findUnique({
          where: { id: item.payloadRef },
          include: {
            product: true,
            order: true,
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

          result.failed++;
          result.errors.push({
            outboxId: item.id,
            error: `License ${item.payloadRef} not found in database.`,
          });
          continue;
        }

        // Decrypt license key in memory; never log decrypted key
        const decryptedKey = decryptLicenseKey(license);
        const resolvedKey = decryptedKey || '[Legacy Unrecoverable Key - Contact Support]';
        const downloadToken = createPurchaseAuthToken(license.id, license.id, license.email);
        const downloadUrl = `${appBaseUrl}/api/download-installer?token=${encodeURIComponent(downloadToken)}`;

        let emailContent: { subject: string; text: string; html: string };
        if (item.kind === 'LICENSE_RECOVERY') {
          const subject = `[Nav Brahmi] Recovered License Key for ${license.product.name}`;
          const text = decryptedKey
            ? `Hello,\n\nHere are your recovered software license details for ${license.product.name}:\n\nLicense Key: ${decryptedKey}\n\nInstallation Guide: ${appBaseUrl}/instructions\nInstaller Download: ${downloadUrl}\n\nExisting machine activations remain active.\n\nNav Brahmi Computing Technologies\nhttps://brahmicomputing.in`
            : `Hello,\n\nA purchase was located for ${license.product.name}. However, because your license predates encrypted key storage, please contact support@brahmicomputing.in with your purchase email to retrieve your key.\n\nNav Brahmi Computing Technologies\nhttps://brahmicomputing.in`;
          const html = `<p>${text.replace(/\n/g, '<br>')}</p>`;
          emailContent = { subject, text, html };
        } else {
          emailContent = renderLicenseDeliveryEmail({
            customerName: license.order?.customerName || undefined,
            customerEmail: license.email,
            productName: license.product.name,
            licenseKey: resolvedKey,
            instructionsUrl: `${appBaseUrl}/instructions`,
            downloadUrl,
            orderToken: license.order?.publicToken || license.id,
          });
        }

        const sendResult = await transport.sendMail({
          to: item.toEmail,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });

        if (sendResult.success) {
          await prisma.$transaction(async (tx) => {
            await tx.emailOutbox.update({
              where: { id: item.id },
              data: {
                status: EmailOutboxStatus.SENT,
                sentAt: new Date(),
              },
            });

            // If order was LICENSE_ISSUED, advance to DELIVERED
            if (license.order && license.order.status === OrderStatus.LICENSE_ISSUED) {
              await tx.order.update({
                where: { id: license.order.id },
                data: { status: OrderStatus.DELIVERED },
              });
            }
          });

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

          result.sent++;
        } else {
          // Failed delivery attempt -> schedule retry or mark FAILED
          const nextAttempt = item.attempts + 1;
          const isTerminal = nextAttempt >= 5;
          const backoffMinutes = Math.pow(2, nextAttempt); // 2, 4, 8, 16 minutes
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

          result.failed++;
          result.errors.push({
            outboxId: item.id,
            error: sendResult.error || 'Unknown send failure',
          });
        }
      } else {
        // Unknown or unhandled kind
        logger.warn('Unhandled EmailOutbox kind encountered', {
          outboxId: item.id,
          kind: item.kind,
        });
        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: { status: EmailOutboxStatus.FAILED },
        });
        result.failed++;
      }
    } catch (err: any) {
      logger.error('Unexpected error processing outbox item', {
        outboxId: item.id,
        error: err.message,
      });
      result.failed++;
      result.errors.push({
        outboxId: item.id,
        error: err.message,
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
