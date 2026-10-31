import { NextRequest, NextResponse } from 'next/server';
import { submitRefundRequest, RefundRequestError } from '@/lib/refund-request';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    let body: { reason?: string; supportingInfo?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } },
        { status: 400 }
      );
    }

    const result = await submitRefundRequest({
      orderToken: token,
      reason: body.reason || '',
      supportingInfo: body.supportingInfo,
      ip,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err instanceof RefundRequestError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while submitting your refund request.' } },
      { status: 500 }
    );
  }
}
