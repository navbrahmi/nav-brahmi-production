import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '../../../lib/rate-limiter';
import { logger } from '../../../lib/logger';
import { recordAuditEvent } from '../../../lib/audit';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  subject: z.string().trim().min(2, 'Subject must be at least 2 characters').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateLimit = await checkRateLimit({
      key: 'contact',
      ip,
      limit: 5,
      windowSeconds: 300, // 5 submissions per 5 minutes per IP
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many contact requests. Please wait a few minutes before submitting again.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid form submission.';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { name, email, subject, message } = parsed.data;

    // Structured redaction logging for contact inquiry
    logger.info('Contact form submission received', {
      senderEmail: email,
      subject,
      nameLength: name.length,
      messageLength: message.length,
    });

    await recordAuditEvent({
      type: 'CONTACT_FORM_SUBMISSION',
      actorType: 'ANONYMOUS',
      metadata: {
        email,
        subject,
        ip,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting Nav Brahmi. Your message has been received.',
    });
  } catch (err) {
    logger.error('Error processing contact form submission', { error: String(err) });
    return NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred while processing your message. Please try again later.',
      },
      { status: 500 }
    );
  }
}
