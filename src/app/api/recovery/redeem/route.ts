import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = (requestHost && !requestHost.includes('localhost')
    ? `${proto}://${requestHost}`
    : (process.env.APP_BASE_URL || 'https://dev.brahmicomputing.in')
  ).replace(/\/+$/, '');

  const isBrowserNavigation = req.headers.get('accept')?.includes('text/html');

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    try {
      const rateLimit = await checkRateLimit({
        key: `ratelimit:recovery_redeem:ip:${ip}`,
        ip,
        limit: 25,
        windowSeconds: 60,
      });

      if (!rateLimit.success) {
        if (isBrowserNavigation) {
          return NextResponse.redirect(`${baseUrl}/recover?error=RATE_LIMIT_EXCEEDED`);
        }
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait a moment.' },
          { status: 429 }
        );
      }
    } catch (rlErr: any) {
      logger.warn('Rate limiter check skipped due to error', { error: rlErr?.message });
    }

    const searchParams = req.nextUrl ? req.nextUrl.searchParams : new URL(req.url, 'http://localhost').searchParams;
    const token = searchParams.get('token')?.trim();

    if (!token || token.length < 32) {
      if (isBrowserNavigation) {
        return NextResponse.redirect(`${baseUrl}/recover?error=INVALID_TOKEN`);
      }
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
      if (isBrowserNavigation) {
        return NextResponse.redirect(`${baseUrl}/recover?error=TOKEN_NOT_FOUND`);
      }
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
      if (isBrowserNavigation) {
        return NextResponse.redirect(`${baseUrl}/recover?error=TOKEN_ALREADY_USED`);
      }
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
      if (isBrowserNavigation) {
        return NextResponse.redirect(`${baseUrl}/recover?error=TOKEN_EXPIRED`);
      }
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

    // Mark token as used immediately (non-pooled single statement to prevent PgBouncer transaction drop)
    await prisma.recoveryToken.update({
      where: { id: recoveryRecord.id },
      data: { usedAt: now },
    });

    // Lookup active licenses with order metadata
    const licenses = await prisma.license.findMany({
      where: {
        email: { equals: recoveryRecord.email, mode: 'insensitive' },
        status: 'ACTIVE',
      },
      include: {
        product: true,
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Queue email outbox items for customer record
    for (const lic of licenses) {
      try {
        await prisma.emailOutbox.create({
          data: {
            kind: 'LICENSE_RECOVERY',
            toEmail: recoveryRecord.email,
            payloadRef: lic.id,
            status: 'PENDING',
          },
        });
      } catch (outboxErr: any) {
        logger.warn('Failed to insert recovery email outbox row', { error: outboxErr.message });
      }
    }

    // Attempt immediate transmission of queued outbox items
    try {
      const { processEmailOutbox } = await import('@/lib/email/outbox');
      await processEmailOutbox({ limit: 5 });
    } catch (err: any) {
      logger.warn('Immediate recovery outbox dispatch notice', {
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
          recoveredCount: licenses.length,
        },
      },
    }).catch(() => {});

    // For standard browser clicks from email, redirect user to their secure Order Fulfillment Portal
    if (isBrowserNavigation) {
      if (licenses.length > 0 && licenses[0].order?.publicToken) {
        return NextResponse.redirect(`${baseUrl}/orders/${encodeURIComponent(licenses[0].order.publicToken)}`);
      }
      return NextResponse.redirect(`${baseUrl}/recover?recovered=true`);
    }

    const atIdx = recoveryRecord.email.indexOf('@');
    const domain = atIdx !== -1 ? recoveryRecord.email.substring(atIdx) : '';
    const maskedEmail = recoveryRecord.email.substring(0, Math.min(3, atIdx)) + '***' + domain;

    return NextResponse.json(
      {
        success: true,
        email_masked: maskedEmail,
        recovered_count: licenses.length,
        message: 'Recovery verified. Your license details have been sent to your registered email address.',
        order_token: licenses[0]?.order?.publicToken,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error during recovery token redemption', { error: error?.message });

    if (isBrowserNavigation) {
      return NextResponse.redirect(`${baseUrl}/recover?error=INTERNAL_ERROR`);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error?.message || 'An internal error occurred during redemption.',
        },
      },
      { status: 500 }
    );
  }
}
