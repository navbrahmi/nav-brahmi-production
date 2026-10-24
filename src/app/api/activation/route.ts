import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { signActivationToken } from '@/lib/keys';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate limit per IP: 20 activation attempts per 60 seconds
    const ipRateLimit = await checkRateLimit({
      key: `ratelimit:activation:ip:${ip}`,
      ip,
      limit: 20,
      windowSeconds: 60,
    });

    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          activated: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many activation attempts. Please wait a moment before trying again.',
          },
        },
        { status: 429 }
      );
    }

    let body: {
      license_key?: string;
      machine_id?: string;
      product_code?: string;
      platform?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          activated: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON request body.',
          },
        },
        { status: 400 }
      );
    }

    const licenseKey = body.license_key?.trim();
    const machineId = body.machine_id?.trim();
    const requestedProduct = body.product_code?.trim().toUpperCase();

    if (!licenseKey) {
      return NextResponse.json(
        {
          success: false,
          activated: false,
          error: {
            code: 'MISSING_LICENSE_KEY',
            message: 'License key is required for activation.',
          },
        },
        { status: 400 }
      );
    }

    if (!machineId) {
      return NextResponse.json(
        {
          success: false,
          activated: false,
          error: {
            code: 'MISSING_MACHINE_ID',
            message: 'Machine ID is required for hardware-bound activation.',
          },
        },
        { status: 400 }
      );
    }

    const keyHash = crypto.createHash('sha256').update(licenseKey).digest('hex');
    const machineIdHash = crypto.createHash('sha256').update(machineId).digest('hex');

    // Rate limit per license key: 15 activation requests per 60 seconds
    const keyRateLimit = await checkRateLimit({
      key: `ratelimit:activation:key:${keyHash}`,
      ip,
      limit: 15,
      windowSeconds: 60,
    });

    if (!keyRateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          activated: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many activation attempts for this license key. Please wait a moment.',
          },
        },
        { status: 429 }
      );
    }

    // Execute atomic, serialized activation transaction with row locking
    const result = await prisma.$transaction(async (tx) => {
      // 1. Initial lookup to find license ID
      const initial = await tx.license.findFirst({
        where: {
          OR: [
            { licenseKey },
            { keyLookupHash: keyHash },
          ],
        },
        select: { id: true },
      });

      if (!initial) {
        return {
          status: 401,
          body: {
            success: false,
            activated: false,
            error: {
              code: 'INVALID_LICENSE',
              message: 'License key is invalid or not found.',
            },
          },
        };
      }

      // 2. Acquire exclusive row lock on the License row
      await tx.$executeRaw`SELECT id FROM "License" WHERE id = ${initial.id} FOR UPDATE`;

      // 3. Fetch locked license with relations
      const license = await tx.license.findUnique({
        where: { id: initial.id },
        include: {
          product: true,
          order: true,
          activations: true,
        },
      });

      if (!license) {
        return {
          status: 401,
          body: {
            success: false,
            activated: false,
            error: {
              code: 'INVALID_LICENSE',
              message: 'License key is invalid or not found.',
            },
          },
        };
      }

      if (license.status === 'REVOKED') {
        return {
          status: 403,
          body: {
            success: false,
            activated: false,
            error: {
              code: 'LICENSE_REVOKED',
              message: 'This license has been revoked and cannot be activated.',
            },
          },
        };
      }

      if (license.status === 'EXPIRED') {
        return {
          status: 403,
          body: {
            success: false,
            activated: false,
            error: {
              code: 'LICENSE_EXPIRED',
              message: 'This license has expired.',
            },
          },
        };
      }

      if (license.status !== 'ACTIVE') {
        return {
          status: 403,
          body: {
            success: false,
            activated: false,
            error: {
              code: 'LICENSE_NOT_ACTIVE',
              message: `License status is ${license.status.toLowerCase()}.`,
            },
          },
        };
      }

      if (license.order) {
        const allowedOrderStatuses = ['PAID', 'LICENSE_ISSUED', 'DELIVERED'];
        if (!allowedOrderStatuses.includes(license.order.status)) {
          return {
            status: 403,
            body: {
              success: false,
              activated: false,
              error: {
                code: 'ORDER_PAYMENT_PENDING',
                message: `Associated order payment status is ${license.order.status}.`,
              },
            },
          };
        }
      }

      const productCode = license.product?.code || license.product?.slug || 'NAV-BRAHMI';
      if (requestedProduct && license.product) {
        const matchesCode = license.product.code?.toUpperCase() === requestedProduct;
        const matchesSlug = license.product.slug?.toUpperCase() === requestedProduct;
        const matchesId = license.product.id === requestedProduct;
        if (!matchesCode && !matchesSlug && !matchesId) {
          return {
            status: 400,
            body: {
              success: false,
              activated: false,
              error: {
                code: 'PRODUCT_MISMATCH',
                message: 'License key does not match requested product.',
              },
            },
          };
        }
      }

      const activeActivations = license.activations.filter((a) => a.status === 'ACTIVE');
      const existingActivation = activeActivations.find((a) => a.machineIdHash === machineIdHash);

      const now = new Date();
      const nowSec = Math.floor(Date.now() / 1000);
      const tokenTtlSec = 3600; // 1-hour valid token for download authorization

      // CASE 1: Idempotent re-activation on the same authorized machine
      if (existingActivation) {
        await tx.activation.update({
          where: { id: existingActivation.id },
          data: { lastSeenAt: now },
        });

        const token = signActivationToken({
          lic: license.id,
          prd: productCode,
          mch: machineIdHash,
          iat: nowSec,
          exp: nowSec + tokenTtlSec,
          status: 'ACTIVE',
        });

        return {
          status: 200,
          body: {
            success: true,
            activated: true,
            token,
            license_id: license.id,
            product_id: license.productId,
            product_code: productCode,
            product_name: license.product?.name || 'Nav Brahmi Keyboard Driver',
            status: 'ACTIVE',
            message: 'Authorized machine recognized. Activation token re-issued.',
          },
        };
      }

      // CASE 2: New machine activation — check activation limits
      const maxAllowed = license.maxActivations ?? 1; // Default 1 per agreement & prototype baseline (C-07)
      if (activeActivations.length >= maxAllowed) {
        // Remediation of F-11: Do NOT leak existing bound machine hashes or IDs!
        return {
          status: 403,
          body: {
            success: false,
            activated: false,
            error: {
              code: 'ACTIVATION_LIMIT_REACHED',
              message: `This license has reached its maximum activation limit (${maxAllowed} machine). Machine replacement requires client support confirmation (C-07).`,
            },
          },
        };
      }

      // Bind new machine atomically
      await tx.activation.create({
        data: {
          licenseId: license.id,
          machineIdHash,
          status: 'ACTIVE',
          firstSeenAt: now,
          lastSeenAt: now,
        },
      });

      await tx.license.update({
        where: { id: license.id },
        data: {
          activatedAt: license.activatedAt || now,
          activationStatus: 'ACTIVE',
          machineId: machineIdHash, // backward compatibility
        },
      });

      await tx.auditEvent.create({
        data: {
          type: 'LICENSE_ACTIVATED',
          actorType: 'ANONYMOUS',
          actorId: ip,
          refType: 'LICENSE',
          refId: license.id,
          metadata: {
            productId: license.productId,
            productCode,
            machinePrefix: machineIdHash.substring(0, 8),
            activationsCount: activeActivations.length + 1,
            maxAllowed,
          },
        },
      });

      const token = signActivationToken({
        lic: license.id,
        prd: productCode,
        mch: machineIdHash,
        iat: nowSec,
        exp: nowSec + tokenTtlSec,
        status: 'ACTIVE',
      });

      return {
        status: 200,
        body: {
          success: true,
          activated: true,
          token,
          license_id: license.id,
          product_id: license.productId,
          product_code: productCode,
          product_name: license.product?.name || 'Nav Brahmi Keyboard Driver',
          status: 'ACTIVE',
          message: 'License activated successfully on this machine.',
        },
      };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    logger.error('Error during machine activation', { error: error?.message });
    return NextResponse.json(
      {
        success: false,
        activated: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred during machine activation.',
        },
      },
      { status: 500 }
    );
  }
}
