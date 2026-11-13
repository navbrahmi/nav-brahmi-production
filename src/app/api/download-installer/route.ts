import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { verifyPurchaseAuthToken, createPurchaseAuthToken } from '@/lib/license';
import { verifyActivationToken } from '@/lib/keys';
import { decryptLicenseKey } from '@/lib/license-crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

async function serveInstaller(
  req: NextRequest,
  options: {
    orderTokenParam?: string | null;
    tokenParam?: string | null;
    fileParam?: string | null;
    hasLicenseKeyInParams?: boolean;
  }
) {
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

    const { orderTokenParam, tokenParam, fileParam, hasLicenseKeyInParams } = options;

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
    if (hasLicenseKeyInParams) {
      return NextResponse.json(
        {
          error: 'Passing raw license keys in request parameters is prohibited. Use an order token or signed authorization.',
        },
        { status: 400 }
      );
    }

    // Require either orderToken or signed authorization token
    if (!orderTokenParam && !tokenParam) {
      return NextResponse.json(
        { error: 'Valid authorization token or order token is required to download installer.' },
        { status: 401 }
      );
    }

    let licenseId: string | null = null;
    let licenseKey: string | null = null;
    let resolvedToken = tokenParam;
    let licenseRecord: any = null;

    if (orderTokenParam) {
      // Resolve license via public orderToken (Zero sensitive keys/JWT in URL)
      const order = await prisma.order.findUnique({
        where: { publicToken: orderTokenParam },
        include: {
          licenses: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!order || order.licenses.length === 0) {
        return NextResponse.json(
          { error: 'Order not found or no active license exists for this purchase.' },
          { status: 404 }
        );
      }

      licenseRecord = order.licenses[0];
      licenseId = licenseRecord.id;
      licenseKey = decryptLicenseKey(licenseRecord) || licenseRecord.licenseKey || '';
      resolvedToken = createPurchaseAuthToken(licenseKey || '', licenseRecord.id, licenseRecord.email);
    } else if (tokenParam) {
      // Verify token (supports either purchase auth token or activation token)
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

      licenseRecord = await prisma.license.findUnique({
        where: { id: licenseId },
      });

      if (!licenseRecord || licenseRecord.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Associated license is no longer active.' },
          { status: 403 }
        );
      }

      if (!licenseKey) {
        licenseKey = decryptLicenseKey(licenseRecord) || licenseRecord.licenseKey;
      }
    }

    logger.info('Serving installer download', {
      ip,
      authMethod: orderTokenParam ? 'order_token' : 'auth_token',
      licenseIdRedacted: licenseId ? `${licenseId.substring(0, 8)}...` : undefined,
    });

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
      token: resolvedToken || tokenParam,
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Referrer-Policy': 'no-referrer',
        'Pragma': 'no-cache',
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

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl ? req.nextUrl.searchParams : new URL(req.url, 'http://localhost').searchParams;
  const orderTokenParam = searchParams.get('orderToken')?.trim() || searchParams.get('order_token')?.trim() || req.headers.get('x-order-token')?.trim();
  const tokenParam =
    searchParams.get('token')?.trim() ||
    req.headers.get('x-download-token')?.trim() ||
    (req.headers.get('authorization')?.startsWith('Bearer ')
      ? req.headers.get('authorization')?.substring(7).trim()
      : null);
  const fileParam = searchParams.get('file')?.toLowerCase();
  const hasLicenseKeyInParams = searchParams.has('licenseKey') || searchParams.has('license_key');

  return serveInstaller(req, { orderTokenParam, tokenParam, fileParam, hasLicenseKeyInParams });
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const orderTokenParam = (body.orderToken || body.order_token)?.trim() || req.headers.get('x-order-token')?.trim();
  const tokenParam =
    (body.token || body.download_token)?.trim() ||
    req.headers.get('x-download-token')?.trim() ||
    (req.headers.get('authorization')?.startsWith('Bearer ')
      ? req.headers.get('authorization')?.substring(7).trim()
      : null);
  const fileParam = body.file?.toLowerCase();
  const hasLicenseKeyInParams = Boolean(body.licenseKey || body.license_key);

  return serveInstaller(req, { orderTokenParam, tokenParam, fileParam, hasLicenseKeyInParams });
}
