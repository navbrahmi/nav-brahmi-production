import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { isValidEmail } from '@/lib/license';
import { checkRateLimit } from '@/lib/rate-limit';
import { getEmailTransport } from '@/lib/email/transport';
import { renderLicenseRecoveryEmail } from '@/lib/email/templates';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate limit per IP: 10 recovery requests per 60 seconds
    const ipRateLimit = await checkRateLimit({
      key: `ratelimit:recovery:ip:${ip}`,
      ip,
      limit: 10,
      windowSeconds: 60,
    });

    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many recovery requests. Please wait before trying again.',
          },
        },
        { status: 429 }
      );
    }

    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON request body.',
          },
        },
        { status: 400 }
      );
    }

    const email = body.email?.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Please provide a valid email address.',
          },
        },
        { status: 400 }
      );
    }

    const emailHash = crypto.createHash('sha256').update(email).digest('hex');

    // Rate limit per email hash: 5 recovery requests per 10 minutes (600s)
    const emailRateLimit = await checkRateLimit({
      key: `ratelimit:recovery:email:${emailHash}`,
      ip,
      limit: 5,
      windowSeconds: 600,
    });

    if (!emailRateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many recovery requests for this email address. Please check your inbox or wait a few minutes.',
          },
        },
        { status: 429 }
      );
    }

    // Generic response message returned identically for both known and unknown emails
    // Anti-enumeration principle: never reveal whether an email exists in database (F-05 remediation)
    const genericResponse = {
      success: true,
      message: 'If a matching purchase exists for this email address, license recovery instructions have been emailed.',
    };

    // Lookup licenses for this email
    const licenses = await prisma.license.findMany({
      where: {
        email: { equals: email, mode: 'insensitive' },
        status: 'ACTIVE',
      },
      include: { product: true },
    });

    if (licenses.length === 0) {
      // Record audit event for unknown request without leaking details
      await prisma.auditEvent.create({
        data: {
          type: 'RECOVERY_REQUESTED_UNKNOWN',
          actorType: 'ANONYMOUS',
          actorId: ip,
          metadata: { emailPrefix: email.substring(0, 3) + '***' },
        },
      }).catch(() => {});

      return NextResponse.json(genericResponse, { status: 200 });
    }

    // Generate single-use, cryptographically secure 32-byte recovery token
    const rawRecoveryToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRecoveryToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes TTL

    // Store ONLY the SHA-256 hash in database
    await prisma.recoveryToken.create({
      data: {
        email,
        tokenHash,
        expiresAt,
      },
    });

    // Queue in EmailOutbox and dispatch via transport
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const recoveryUrl = `${baseUrl.replace(/\/+$/, '')}/api/recovery/redeem?token=${rawRecoveryToken}`;

    const { subject, text, html } = renderLicenseRecoveryEmail({
      customerEmail: email,
      recoveryUrl,
      expiresInMinutes: 30,
    });

    // Queue in EmailOutbox
    const outboxItem = await prisma.emailOutbox.create({
      data: {
        kind: 'RECOVERY_LINK',
        toEmail: email,
        payloadRef: tokenHash,
        status: 'PENDING',
      },
    });

    // Attempt immediate transmission
    const transport = getEmailTransport();
    const sendResult = await transport.sendMail({
      to: email,
      subject,
      text,
      html,
    });

    if (sendResult.success) {
      await prisma.emailOutbox.update({
        where: { id: outboxItem.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } else {
      logger.warn('Recovery email dispatch delayed; queued in EmailOutbox for retry', {
        error: sendResult.error,
      });
    }

    // Record audit event (no secrets, no raw token, masked email)
    await prisma.auditEvent.create({
      data: {
        type: 'RECOVERY_REQUESTED_DISPATCHED',
        actorType: 'ANONYMOUS',
        actorId: ip,
        metadata: {
          emailPrefix: email.substring(0, 3) + '***',
          licensesCount: licenses.length,
        },
      },
    }).catch(() => {});

    return NextResponse.json(genericResponse, { status: 200 });
  } catch (error: any) {
    logger.error('Error during license recovery request', { error: error?.message });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred processing your recovery request.',
        },
      },
      { status: 500 }
    );
  }
}
