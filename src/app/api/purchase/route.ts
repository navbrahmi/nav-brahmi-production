import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Finding F-04 Remediation:
 * Legacy /api/purchase issued free, unverified licenses.
 * Production purchases strictly require verified payment via /api/checkout.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: {
        code: 'PAYMENT_REQUIRED',
        message:
          'Unpaid license issuance is disabled in production (F-04 remediation). Please use the official /api/checkout endpoint with verified payment processing.',
      },
    },
    { status: 400 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Endpoint deprecated. Use /api/checkout for order creation.',
      },
    },
    { status: 405 }
  );
}
