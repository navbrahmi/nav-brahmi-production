import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * License deactivation endpoint.
 * Per Task 1 and Standing Rule 8:
 * "Deactivation only if explicitly included in the confirmed C-07 rules.
 * If C-07 is unresolved, do not invent machine limits, reset behavior, or deactivation policies."
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'DEACTIVATION_POLICY_UNCONFIRMED',
        message: 'License deactivation and machine reset policies require client confirmation (C-07). Deactivation is not currently enabled.',
      },
    },
    { status: 400 }
  );
}
