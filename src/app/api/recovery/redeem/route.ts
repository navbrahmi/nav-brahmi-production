import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = (requestHost && !requestHost.includes('localhost')
    ? `${proto}://${requestHost}`
    : (process.env.APP_BASE_URL || 'https://dev.brahmicomputing.in')
  ).replace(/\/+$/, '');

  const searchParams = req.nextUrl ? req.nextUrl.searchParams : new URL(req.url, 'http://localhost').searchParams;
  const token = searchParams.get('token')?.trim();

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/recover?error=INVALID_TOKEN`);
  }

  // Redirect legacy redeem endpoints to the Unified License Recovery Portal
  return NextResponse.redirect(`${baseUrl}/recover/portal?token=${encodeURIComponent(token)}`);
}
