import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifyActivationToken } from '@/lib/keys';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    const rateLimit = await checkRateLimit({
      key: `ratelimit:act_report:ip:${ip}`,
      ip,
      limit: 60,
      windowSeconds: 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many reports. Please slow down.' },
        { status: 429 }
      );
    }

    let body: {
      token?: string;
      machine_id?: string;
      status?: string;
      error_code?: string;
      reboot_required?: boolean;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const token = body.token?.trim();
    const machineId = body.machine_id?.trim();
    const status = (body.status || 'SUCCESS').toUpperCase();

    if (!token || !machineId) {
      return NextResponse.json(
        { success: false, error: 'Token and machine_id are required.' },
        { status: 400 }
      );
    }

    const machineIdHash = crypto.createHash('sha256').update(machineId).digest('hex');

    const tokenVerification = verifyActivationToken(token);
    if (!tokenVerification.valid || !tokenVerification.payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid activation token signature.' },
        { status: 401 }
      );
    }

    const payload = tokenVerification.payload;
    const tokenMachine = payload.mch || payload.machine_id;
    if (tokenMachine !== machineId && tokenMachine !== machineIdHash) {
      return NextResponse.json(
        { success: false, error: 'Machine ID mismatch.' },
        { status: 403 }
      );
    }

    const licenseId = payload.lic || payload.license_id;

    await prisma.auditEvent.create({
      data: {
        type: 'INSTALLATION_REPORTED',
        actorType: 'ANONYMOUS',
        actorId: ip,
        refType: 'LICENSE',
        refId: licenseId,
        metadata: {
          status,
          errorCode: body.error_code || null,
          rebootRequired: body.reboot_required || false,
          machinePrefix: machineIdHash.substring(0, 8),
        },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Internal error recording activation report.' },
      { status: 500 }
    );
  }
}
