import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate limit per IP: 30 requests per 60 seconds
    const ipRateLimit = await checkRateLimit({
      key: `ratelimit:validate:ip:${ip}`,
      ip,
      limit: 30,
      windowSeconds: 60,
    });

    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          valid: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many license validation requests. Please try again shortly.',
          },
        },
        { status: 429 }
      );
    }

    let body: { license_key?: string; product_code?: string; platform?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          valid: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON request body.',
          },
        },
        { status: 400 }
      );
    }

    const licenseKey = body.license_key?.trim();
    const requestedProduct = body.product_code?.trim().toUpperCase();

    if (!licenseKey) {
      return NextResponse.json(
        {
          valid: false,
          error: {
            code: 'MISSING_LICENSE_KEY',
            message: 'License key is required.',
          },
        },
        { status: 400 }
      );
    }

    const keyHash = crypto.createHash('sha256').update(licenseKey).digest('hex');

    // Rate limit per license key hash: 20 requests per 60 seconds
    const keyRateLimit = await checkRateLimit({
      key: `ratelimit:validate:key:${keyHash}`,
      ip,
      limit: 20,
      windowSeconds: 60,
    });

    if (!keyRateLimit.success) {
      return NextResponse.json(
        {
          valid: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many validation attempts for this license key. Please wait a moment.',
          },
        },
        { status: 429 }
      );
    }

    // Lookup license by key or lookup hash
    const license = await prisma.license.findFirst({
      where: {
        OR: [
          { licenseKey },
          { keyLookupHash: keyHash },
        ],
      },
      include: {
        product: true,
        order: true,
        activations: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!license) {
      return NextResponse.json(
        {
          valid: false,
          error: {
            code: 'INVALID_LICENSE',
            message: 'License key is invalid or not found.',
          },
        },
        { status: 401 }
      );
    }

    if (license.status === 'REVOKED') {
      return NextResponse.json(
        {
          valid: false,
          error: {
            code: 'LICENSE_REVOKED',
            message: 'This license has been revoked.',
          },
        },
        { status: 403 }
      );
    }

    if (license.status === 'EXPIRED') {
      return NextResponse.json(
        {
          valid: false,
          error: {
            code: 'LICENSE_EXPIRED',
            message: 'This license has expired.',
          },
        },
        { status: 403 }
      );
    }

    if (license.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          valid: false,
          error: {
            code: 'LICENSE_SUSPENDED',
            message: `This license is currently ${license.status.toLowerCase()}.`,
          },
        },
        { status: 403 }
      );
    }

    // Verify order payment status if linked to an order
    if (license.order) {
      const allowedOrderStatuses = ['PAID', 'LICENSE_ISSUED', 'DELIVERED'];
      if (!allowedOrderStatuses.includes(license.order.status)) {
        return NextResponse.json(
          {
            valid: false,
            error: {
              code: 'ORDER_NOT_COMPLETED',
              message: `Associated order payment status is ${license.order.status}.`,
            },
          },
          { status: 403 }
        );
      }
    }

    // Verify product code if caller specified one
    if (requestedProduct && license.product) {
      const matchesCode = license.product.code?.toUpperCase() === requestedProduct;
      const matchesSlug = license.product.slug?.toUpperCase() === requestedProduct;
      const matchesId = license.product.id === requestedProduct;
      if (!matchesCode && !matchesSlug && !matchesId) {
        return NextResponse.json(
          {
            valid: false,
            error: {
              code: 'PRODUCT_MISMATCH',
              message: 'License key does not match the requested product.',
            },
          },
          { status: 400 }
        );
      }
    }

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        type: 'LICENSE_VALIDATED',
        actorType: 'ANONYMOUS',
        actorId: ip,
        refType: 'LICENSE',
        refId: license.id,
        metadata: {
          productId: license.productId,
          productCode: license.product?.code,
          activeActivationsCount: license.activations.length,
        },
      },
    }).catch((err) => {
      logger.warn('Failed to record LICENSE_VALIDATED audit event', { error: err?.message });
    });

    // Security baseline (F-06): Validation NEVER returns download URLs or presigned links.
    // Downloads strictly require activation and signed token authorization.
    const maxActivations = license.maxActivations ?? 1;

    return NextResponse.json(
      {
        valid: true,
        license_id: license.id,
        product_id: license.productId,
        product_name: license.product?.name || 'Nav Brahmi Driver Suite',
        product_code: license.product?.code || license.product?.slug || 'NAV-BRAHMI',
        max_activations: maxActivations,
        activations_count: license.activations.length,
        activation_available: license.activations.length < maxActivations,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error during license validation', { error: error?.message });
    return NextResponse.json(
      {
        valid: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred while validating license.',
        },
      },
      { status: 500 }
    );
  }
}
