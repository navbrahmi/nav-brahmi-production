import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { decryptLicenseKey, encryptLicenseKey } from '@/lib/license-crypto';
import { generateSecureLicenseKey } from '@/lib/license';
import { executeSupportMachineReset } from '@/lib/admin-reset';
import { recordAuditEvent } from '@/lib/audit';
import { queueOutboxEmail, sendOutboxItemImmediately } from '@/lib/email/outbox';
import { LicenseStatus, OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const status = searchParams.get('status') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (q) {
    const keyHash = crypto.createHash('sha256').update(q).digest('hex');
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { keyLookupHash: keyHash },
      { id: { contains: q, mode: 'insensitive' } },
      { product: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [totalCount, licenses] = await Promise.all([
    prisma.license.count({ where }),
    prisma.license.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, code: true, slug: true } },
        order: { select: { id: true, publicToken: true, amountMinor: true, status: true, customerName: true } },
        activations: {
          select: { id: true, machineIdHash: true, status: true, firstSeenAt: true, lastSeenAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
  ]);

  const sanitizedLicenses = licenses.map((lic) => {
    const resolvedKey = decryptLicenseKey(lic) || lic.licenseKey;
    return {
      id: lic.id,
      email: lic.email,
      licenseKey: resolvedKey,
      status: lic.status,
      maxActivations: lic.maxActivations || 1,
      activationsCount: lic.activations.filter((a) => a.status === 'ACTIVE').length,
      activations: lic.activations,
      resetCount: lic.resetCount,
      installedAt: lic.installedAt,
      lastResetAt: lic.lastResetAt,
      revokedAt: lic.revokedAt,
      revokeReason: lic.revokeReason,
      createdAt: lic.createdAt,
      product: lic.product,
      order: lic.order,
    };
  });

  return NextResponse.json({
    success: true,
    total: totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    licenses: sanitizedLicenses,
  });
}

export async function POST(req: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // Action 1: Reset machine binding
    if (action === 'reset_machine') {
      const { licenseId, reason, supportRef } = body;
      if (!licenseId) {
        return NextResponse.json({ error: 'licenseId is required' }, { status: 400 });
      }

      const result = await executeSupportMachineReset({
        licenseIdentifier: licenseId,
        supportApprovalRef: supportRef || 'ADMIN-DASHBOARD',
        reason: reason || 'Manual reset requested via admin dashboard',
        actorId: 'admin-portal',
        overrideCooldown: true,
        overrideReason: 'Administrator manual override from Admin Panel',
      });

      return NextResponse.json({
        success: true,
        message: 'Machine activation successfully reset. Customer can now activate on a new machine.',
        result,
      });
    }

    // Action 2: Update status (REVOKE, SUSPEND, ACTIVE)
    if (action === 'update_status') {
      const { licenseId, status: newStatus, reason } = body;
      if (!licenseId || !newStatus) {
        return NextResponse.json({ error: 'licenseId and status are required' }, { status: 400 });
      }

      const lic = await prisma.license.findUnique({ where: { id: licenseId } });
      if (!lic) {
        return NextResponse.json({ error: 'License not found' }, { status: 404 });
      }

      const updateData: any = { status: newStatus as LicenseStatus };
      if (newStatus === 'REVOKED') {
        updateData.revokedAt = new Date();
        updateData.revokeReason = reason || 'Revoked by administrator';
      } else if (newStatus === 'ACTIVE') {
        updateData.revokedAt = null;
        updateData.revokeReason = null;
      }

      const updated = await prisma.license.update({
        where: { id: licenseId },
        data: updateData,
      });

      await recordAuditEvent({
        type: `LICENSE_STATUS_${newStatus}`,
        actorType: 'ADMIN',
        refType: 'LICENSE',
        refId: licenseId,
        metadata: { previousStatus: lic.status, newStatus, reason },
      });

      return NextResponse.json({
        success: true,
        message: `License status changed to ${newStatus}.`,
        license: updated,
      });
    }

    // Action 3: Issue new manual license
    if (action === 'issue_manual') {
      const { productId, email, customerName, sendEmail } = body;
      if (!productId || !email) {
        return NextResponse.json({ error: 'productId and email are required' }, { status: 400 });
      }

      const product = await prisma.product.findFirst({
        where: { OR: [{ id: productId }, { code: productId }, { slug: productId }] },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const rawLicenseKey = generateSecureLicenseKey();
      const keyLookupHash = crypto.createHash('sha256').update(rawLicenseKey).digest('hex');
      const encrypted = encryptLicenseKey(rawLicenseKey);

      // Create synthetic manual order and license in transaction
      const { newOrder, newLicense } = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            publicToken: crypto.randomBytes(24).toString('base64url'),
            customerEmail: cleanEmail,
            customerName: customerName || 'Manual Admin Issue',
            productId: product.id,
            amountMinor: product.priceMinor || 0,
            currency: product.currency || 'INR',
            status: OrderStatus.DELIVERED,
          },
        });

        const license = await tx.license.create({
          data: {
            orderId: order.id,
            productId: product.id,
            email: cleanEmail,
            keyLookupHash,
            encryptedKey: encrypted.encryptedKey,
            keyIv: encrypted.keyIv,
            keyTag: encrypted.keyTag,
            keyVersion: encrypted.keyVersion,
            maxActivations: 1,
            status: LicenseStatus.ACTIVE,
          },
        });

        return { newOrder: order, newLicense: license };
      });

      if (sendEmail) {
        const outbox = await queueOutboxEmail({
          kind: 'LICENSE_DELIVERY',
          toEmail: cleanEmail,
          payloadRef: newLicense.id,
        });
        await sendOutboxItemImmediately(outbox.id);
      }

      await recordAuditEvent({
        type: 'MANUAL_LICENSE_ISSUED_BY_ADMIN',
        actorType: 'ADMIN',
        refType: 'LICENSE',
        refId: newLicense.id,
        metadata: { email: cleanEmail, productCode: product.code, orderId: newOrder.id },
      });

      return NextResponse.json({
        success: true,
        message: `License successfully issued for ${product.name}!`,
        licenseKey: rawLicenseKey,
        licenseId: newLicense.id,
        orderId: newOrder.id,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
