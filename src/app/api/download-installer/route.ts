import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { verifyPurchaseAuthToken } from '@/lib/license';
import { verifyActivationToken } from '@/lib/keys';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate limit per IP: 20 download requests per 60 seconds
    const rateLimit = await checkRateLimit({
      key: `ratelimit:download_installer:ip:${ip}`,
      ip,
      limit: 20,
      windowSeconds: 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many download requests. Please try again shortly.' },
        { status: 429 }
      );
    }

    const searchParams = req.nextUrl ? req.nextUrl.searchParams : new URL(req.url, 'http://localhost').searchParams;
    const tokenParam = searchParams.get('token')?.trim();
    const fileParam = searchParams.get('file')?.toLowerCase();

    // Security Rule (Task 5 & F-09):
    // Do NOT serve setup.ps1 or setup.bat by default. Unserved unless explicitly approved.
    if (fileParam === 'ps1' || fileParam === 'bat' || fileParam === 'setup.ps1' || fileParam === 'setup.bat') {
      return NextResponse.json(
        {
          error: 'Direct script downloads are unserved per security policy. Use the official Windows bootstrapper.',
        },
        { status: 403 }
      );
    }

    // Security Rule (F-09): Reject raw licenseKey in query strings to prevent browser history leakage.
    if (searchParams.has('licenseKey') || searchParams.has('license_key')) {
      return NextResponse.json(
        {
          error: 'Passing raw license keys in query parameters is prohibited. Use a signed authorization token.',
        },
        { status: 400 }
      );
    }

    // Require token
    if (!tokenParam) {
      return NextResponse.json(
        { error: 'Signed authorization token is required to download installer.' },
        { status: 401 }
      );
    }

    // Verify token (supports either purchase auth token or activation token)
    let licenseId: string | null = null;
    let licenseKey: string | null = null;

    const purchaseAuth = verifyPurchaseAuthToken(tokenParam);
    if (purchaseAuth.valid && purchaseAuth.payload) {
      licenseId = purchaseAuth.payload.license_id;
      licenseKey = purchaseAuth.payload.license_key;
    } else {
      const actAuth = verifyActivationToken(tokenParam);
      if (actAuth.valid && actAuth.payload) {
        licenseId = actAuth.payload.lic || actAuth.payload.license_id || null;
      }
    }

    if (!licenseId) {
      return NextResponse.json(
        { error: 'Authorization token is invalid, expired, or tampered.' },
        { status: 401 }
      );
    }

    // Verify license in database is active
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!license || license.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Associated license is no longer active.' },
        { status: 403 }
      );
    }

    if (!licenseKey) {
      licenseKey = license.licenseKey;
    }

    const filename = 'Setup.exe';
    const filePath = path.resolve(process.cwd(), 'Requirements', 'windows-driver', filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Installer binary not available on server.' },
        { status: 404 }
      );
    }

    let fileBuffer = fs.readFileSync(filePath);

    // Attach signed authorization payload block to Setup.exe
    const payloadObj = {
      token: tokenParam,
      licenseKey: licenseKey,
      generatedAt: Date.now(),
    };
    const payloadStr = JSON.stringify(payloadObj);
    const payloadBlock = Buffer.from(
      `\r\n---NAV_BRAHMI_AUTH_START---\r\n${payloadStr}\r\n---NAV_BRAHMI_AUTH_END---\r\n`,
      'utf-8'
    );
    fileBuffer = Buffer.concat([fileBuffer, payloadBlock]);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.microsoft.portable-executable',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    logger.error('Error serving installer', { error: error?.message });
    return NextResponse.json(
      { error: 'Internal server error serving installer.' },
      { status: 500 }
    );
  }
}
