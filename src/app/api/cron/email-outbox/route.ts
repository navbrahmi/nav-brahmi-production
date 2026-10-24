import { NextRequest, NextResponse } from 'next/server';
import { processEmailOutbox } from '@/lib/email/outbox';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    // If no secret configured, block access in non-development
    return process.env.NODE_ENV === 'development';
  }

  const authHeader = req.headers.get('authorization')?.trim();
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const headerSecret = req.headers.get('x-cron-secret')?.trim();

  return bearerToken === cronSecret || headerSecret === cronSecret;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid CRON_SECRET is required.' },
      { status: 401 }
    );
  }

  try {
    const result = await processEmailOutbox();
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    logger.error('Error executing email outbox cron', { error: err.message });
    return NextResponse.json(
      { error: 'Failed to process email outbox' },
      { status: 500 }
    );
  }
}
