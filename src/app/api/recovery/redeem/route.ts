import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { createPurchaseAuthToken } from '@/lib/license';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    const rateLimit = await checkRateLimit({
      key: `ratelimit:recovery_redeem:ip:${ip}`,
      ip,
      limit: 20,
      windowSeconds: 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const searchParams = req.nextUrl ? req.nextUrl.searchParams : new URL(req.url, 'http://localhost').searchParams;
    const token = searchParams.get('token')?.trim();

    if (!token || token.length < 32) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Recovery token is missing, malformed, or invalid.',
          },
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Atomic redemption check
    const recoveryRecord = await prisma.recoveryToken.findUnique({
      where: { tokenHash },
    });

    if (!recoveryRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'Recovery link is invalid or has expired.',
          },
        },
        { status: 404 }
      );
    }

    if (recoveryRecord.usedAt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_ALREADY_USED',
            message: 'This recovery link has already been used. Please request a new recovery email if needed.',
          },
        },
        { status: 410 }
      );
    }

    const now = new Date();
    if (recoveryRecord.expiresAt < now) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'This recovery link has expired (30-minute validity limit). Please request a new link.',
          },
        },
        { status: 410 }
      );
    }

    // Transactional redemption and email outbox queueing
    const { recoveredCount } = await prisma.$transaction(async (tx) => {
      // Mark token as used atomically
      await tx.recoveryToken.update({
        where: { id: recoveryRecord.id },
        data: { usedAt: now },
      });

      // Lookup active licenses
      const licenses = await tx.license.findMany({
        where: {
          email: { equals: recoveryRecord.email, mode: 'insensitive' },
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      });

      // Queue an opaque reference in EmailOutbox for each active license
      for (const lic of licenses) {
        await tx.emailOutbox.create({
          data: {
            kind: 'LICENSE_RECOVERY',
            toEmail: recoveryRecord.email,
            payloadRef: lic.id,
            status: 'PENDING',
          },
        });
      }

      return { recoveredCount: licenses.length };
    });

    // Attempt immediate transmission of queued outbox items
    try {
      const { processEmailOutbox } = await import('@/lib/email/outbox');
      await processEmailOutbox({ limit: 5 });
    } catch (err: any) {
      logger.warn('Immediate recovery outbox dispatch delayed; will retry via cron worker', {
        error: err?.message,
      });
    }

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        type: 'RECOVERY_TOKEN_REDEEMED',
        actorType: 'ANONYMOUS',
        actorId: ip,
        metadata: {
          emailPrefix: recoveryRecord.email.substring(0, 3) + '***',
          recoveredCount,
        },
      },
    }).catch(() => {});

    // Return secure response: NEVER return raw or masked license keys in the API response!
    const atIdx = recoveryRecord.email.indexOf('@');
    const domain = atIdx !== -1 ? recoveryRecord.email.substring(atIdx) : '';
    const maskedEmail = recoveryRecord.email.substring(0, Math.min(3, atIdx)) + '***' + domain;

    return NextResponse.json(
      {
        success: true,
        email_masked: maskedEmail,
        recovered_count: recoveredCount,
        message: 'Recovery verified. Your license details have been sent to your registered email address. For security, license keys are never displayed in the browser.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error during recovery token redemption', { error: error?.message });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred during redemption.',
        },
      },
      { status: 500 }
    );
  }
}
