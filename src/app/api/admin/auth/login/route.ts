import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, createAdminSessionToken, COOKIE_NAME } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body;

    const isValid = verifyAdminCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken(username || 'admin');

    const res = NextResponse.json({
      success: true,
      message: 'Admin authenticated successfully.',
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication error.' },
      { status: 500 }
    );
  }
}

