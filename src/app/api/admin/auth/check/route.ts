import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authenticated = await isAuthenticatedAdmin();
  return NextResponse.json({
    authenticated,
  });
}

