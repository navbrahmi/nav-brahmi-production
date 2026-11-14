import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { decryptLicenseKey } from '@/lib/license-crypto';
import { createPurchaseAuthToken } from '@/lib/license';

export const dynamic = 'force-dynamic';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const rateLimit = await checkRateLimit({
    key: 'order_status',
    ip,
    limit: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many status requests.' } },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token')?.trim();

  if (!token) {
    return NextResponse.json(
      { error: { code: 'MISSING_TOKEN', message: 'Order token is required.' } },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: {
      product: true,
      licenses: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          createdAt: true,
          status: true,
          encryptedKey: true,
          keyIv: true,
          keyTag: true,
          licenseKey: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: { code: 'ORDER_NOT_FOUND', message: 'Order not found for the specified token.' } },
      { status: 404 }
    );
  }

  let licenseKey: string | undefined;
  let downloadUrl: string | undefined;

  if (order.licenses.length > 0) {
    const activeLicense = order.licenses[0];
    const decrypted = decryptLicenseKey(activeLicense) || activeLicense.licenseKey;
    if (decrypted) {
      licenseKey = decrypted;
      downloadUrl = '/api/download-installer';
    }
  }

  return NextResponse.json({
    success: true,
    order: {
      publicToken: order.publicToken,
      status: order.status,
      productName: order.product.name,
      amountMinor: order.amountMinor,
      currency: order.currency,
      customerEmail: maskEmail(order.customerEmail),
      customerName: order.customerName,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      hasLicense: order.licenses.length > 0,
      licenseKey,
      downloadUrl,
    },
  });
}
