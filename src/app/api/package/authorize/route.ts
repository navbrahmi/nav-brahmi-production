import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { verifyActivationToken } from '@/lib/keys';
import { resolveProductPackage, getPresignedGetUrl } from '@/lib/storage';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate limit per IP: 30 package authorizations per 60 seconds
    const ipRateLimit = await checkRateLimit({
      key: `ratelimit:package_auth:ip:${ip}`,
      ip,
      limit: 30,
      windowSeconds: 60,
    });

    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many package authorization requests. Please try again shortly.',
          },
        },
        { status: 429 }
      );
    }

    let body: {
      token?: string;
      machine_id?: string;
      architecture?: string;
      product_code?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON request body.',
          },
        },
        { status: 400 }
      );
    }

    const token = body.token?.trim();
    const machineId = body.machine_id?.trim();
    const requestedArch = (body.architecture || 'x64').toLowerCase().trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Signed activation token is required for package authorization.',
          },
        },
        { status: 401 }
      );
    }

    if (!machineId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_MACHINE_ID',
            message: 'Machine ID is required for hardware-bound authorization.',
          },
        },
        { status: 400 }
      );
    }

    const machineIdHash = crypto.createHash('sha256').update(machineId).digest('hex');

    // 1. Verify Ed25519 token signature & validity
    const tokenVerification = verifyActivationToken(token);
    if (!tokenVerification.valid || !tokenVerification.payload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: tokenVerification.error || 'Activation token signature verification failed.',
          },
        },
        { status: 401 }
      );
    }

    const payload = tokenVerification.payload;
    const tokenMachine = payload.mch || payload.machine_id;

    // 2. Enforce strict machine binding (both raw and SHA-256 hash supported)
    if (tokenMachine !== machineId && tokenMachine !== machineIdHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MACHINE_MISMATCH',
            message: 'Activation token is bound to a different machine.',
          },
        },
        { status: 403 }
      );
    }

    // 3. Verify license and activation in database
    const licenseId = payload.lic || payload.license_id;
    if (!licenseId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MALFORMED_TOKEN',
            message: 'Token does not contain a valid license identifier.',
          },
        },
        { status: 401 }
      );
    }

    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: {
        product: true,
        activations: {
          where: {
            status: 'ACTIVE',
            OR: [
              { machineIdHash },
              { machineIdHash: tokenMachine },
            ],
          },
        },
      },
    });

    if (!license || license.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LICENSE_INACTIVE',
            message: 'Associated license is inactive, expired, or revoked.',
          },
        },
        { status: 403 }
      );
    }

    if (license.activations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACTIVATION_NOT_FOUND',
            message: 'No active machine binding exists for this license and hardware.',
          },
        },
        { status: 403 }
      );
    }

    // 4. Validate Architecture (C-06)
    const normalizedArch = requestedArch === 'amd64' ? 'x64' : requestedArch === 'i386' ? 'x86' : requestedArch;
    if (normalizedArch !== 'x64' && normalizedArch !== 'x86') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNSUPPORTED_ARCHITECTURE',
            message: `Processor architecture "${body.architecture}" is not supported. Supported architectures are x64 and x86 (C-06).`,
          },
        },
        { status: 400 }
      );
    }

    // 5. Resolve ProductPackage from database (never fallback!)
    const productIdentifier = payload.prd || payload.product_code || license.product?.code || license.productId;
    let pkg;
    try {
      pkg = await resolveProductPackage(productIdentifier, normalizedArch);
    } catch (err: any) {
      logger.warn('Package resolution failed', {
        product: productIdentifier,
        arch: normalizedArch,
        error: err?.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_NOT_FOUND',
            message: `Driver package not available for product "${productIdentifier}" and architecture "${normalizedArch}".`,
          },
        },
        { status: 404 }
      );
    }

    // 6. Generate short-lived presigned Backblaze B2 download URL (max 900s / 15m)
    const presignedUrl = await getPresignedGetUrl(pkg.objectKey, 900);

    // 7. Record AuditEvent
    await prisma.auditEvent.create({
      data: {
        type: 'PACKAGE_AUTHORIZED',
        actorType: 'ANONYMOUS',
        actorId: ip,
        refType: 'LICENSE',
        refId: license.id,
        metadata: {
          productId: license.productId,
          architecture: normalizedArch,
          version: pkg.version,
          sizeBytes: pkg.sizeBytes.toString(),
        },
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        url: presignedUrl,
        expiresInSeconds: 900,
        fileName: path.basename(pkg.objectKey),
        sha256: pkg.sha256,
        sizeBytes: Number(pkg.sizeBytes),
        version: pkg.version,
        architecture: normalizedArch,
        product_code: license.product?.code || productIdentifier,
        product_name: license.product?.name || 'Nav Brahmi Keyboard Driver',
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error in package authorization', { error: error?.message });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred authorizing package download.',
        },
      },
      { status: 500 }
    );
  }
}
