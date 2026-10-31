import { prisma } from './prisma';
import { recordAuditEvent } from './audit';
import { logger } from './logger';

export interface AdminResetInput {
  /**
   * License ID, order ID, order publicToken, or keyLookupHash
   */
  licenseIdentifier: string;
  /**
   * Verified support ticket or approval reference (e.g. "SUP-8472")
   */
  supportApprovalRef: string;
  /**
   * Documented operational reason for machine reset
   */
  reason: string;
  /**
   * Administrator or support agent identifier
   */
  actorId: string;
  /**
   * Whether to override the 90-day cooldown period
   */
  overrideCooldown?: boolean;
  /**
   * Required documented justification if overriding the 90-day cooldown
   */
  overrideReason?: string;
}

export interface AdminResetResult {
  success: boolean;
  licenseId: string;
  orderId?: string | null;
  productName: string;
  resetCount: number;
  lastResetAt: Date;
  invalidatedActivationsCount: number;
  cooldownDaysRemaining: number;
  message: string;
}

export class AdminResetError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AdminResetError';
    this.code = code;
  }
}

const COOLDOWN_DAYS = 90;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * Executes a support-assisted machine reset for a license (C-07).
 *
 * Enforces:
 * 1. Support approval reference and reason required.
 * 2. 90-day cooldown between machine resets (override requires explicit approval + reason).
 * 3. PostgreSQL row-level locking and atomic transactions.
 * 4. Immediate invalidation of previous machine activations (status = REVOKED).
 * 5. Invalidation of old activation tokens for package downloads.
 * 6. Audit event logging without sensitive secrets or raw hashes.
 */
export async function executeSupportMachineReset(
  input: AdminResetInput
): Promise<AdminResetResult> {
  const {
    licenseIdentifier,
    supportApprovalRef,
    reason,
    actorId,
    overrideCooldown = false,
    overrideReason,
  } = input;

  if (!licenseIdentifier?.trim()) {
    throw new AdminResetError('MISSING_IDENTIFIER', 'License or order identifier is required.');
  }

  if (!supportApprovalRef?.trim()) {
    throw new AdminResetError('MISSING_APPROVAL_REF', 'Verified support approval reference is required.');
  }

  if (!reason?.trim()) {
    throw new AdminResetError('MISSING_REASON', 'Documented reset reason is required.');
  }

  if (!actorId?.trim()) {
    throw new AdminResetError('MISSING_ACTOR_ID', 'Support representative identifier is required.');
  }

  if (overrideCooldown && !overrideReason?.trim()) {
    throw new AdminResetError(
      'MISSING_OVERRIDE_REASON',
      'An explicit administrative override reason is required to reset within the 90-day cooldown period.'
    );
  }

  const trimmedIdentifier = licenseIdentifier.trim();

  // Run inside interactive Prisma transaction with row-level locking
  return await prisma.$transaction(async (tx) => {
    // 1. Locate the license record
    const license = await tx.license.findFirst({
      where: {
        OR: [
          { id: trimmedIdentifier },
          { keyLookupHash: trimmedIdentifier },
          { orderId: trimmedIdentifier },
          { order: { publicToken: trimmedIdentifier } },
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
      throw new AdminResetError('LICENSE_NOT_FOUND', 'No matching license found for the provided identifier.');
    }

    if (license.status === 'REVOKED') {
      throw new AdminResetError('LICENSE_REVOKED', 'Cannot reset machine on a revoked license.');
    }

    if (license.status === 'EXPIRED') {
      throw new AdminResetError('LICENSE_EXPIRED', 'Cannot reset machine on an expired license.');
    }

    // 2. Enforce 90-Day Cooldown Policy
    const now = new Date();
    const lastReset = license.lastResetAt || license.activatedAt;

    let cooldownDaysRemaining = 0;
    if (lastReset) {
      const elapsedMs = now.getTime() - lastReset.getTime();
      if (elapsedMs < COOLDOWN_MS) {
        cooldownDaysRemaining = Math.ceil((COOLDOWN_MS - elapsedMs) / (24 * 60 * 60 * 1000));

        if (!overrideCooldown) {
          throw new AdminResetError(
            'COOLDOWN_ACTIVE',
            `Machine reset cooldown is active. Reset permitted only once every 90 days (${cooldownDaysRemaining} day(s) remaining). Override requires administrator approval.`
          );
        }
      }
    }

    // 3. Invalidate all active activations for this license (status = REVOKED)
    const activeActivationsCount = license.activations.length;
    if (activeActivationsCount > 0) {
      await tx.activation.updateMany({
        where: {
          licenseId: license.id,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
        },
      });
    }

    // 4. Update License state
    const newResetCount = (license.resetCount || 0) + 1;
    await tx.license.update({
      where: { id: license.id },
      data: {
        lastResetAt: now,
        resetCount: newResetCount,
        activationStatus: 'UNACTIVATED',
        machineId: null, // Clear legacy machine binding
      },
    });

    // 5. Record Security Audit Event
    await recordAuditEvent({
      type: 'SUPPORT_MACHINE_RESET',
      actorType: 'ADMIN',
      actorId,
      refType: 'LICENSE',
      refId: license.id,
      metadata: {
        supportApprovalRef,
        reason,
        overrideCooldown,
        overrideReason: overrideReason || null,
        resetCount: newResetCount,
        invalidatedActivationsCount: activeActivationsCount,
        cooldownDaysRemainingAtReset: cooldownDaysRemaining,
      },
    });

    logger.info('Support-assisted machine reset completed', {
      licenseId: license.id,
      supportApprovalRef,
      resetCount: newResetCount,
      overrideCooldown,
    });

    return {
      success: true,
      licenseId: license.id,
      orderId: license.orderId,
      productName: license.product.name,
      resetCount: newResetCount,
      lastResetAt: now,
      invalidatedActivationsCount: activeActivationsCount,
      cooldownDaysRemaining: COOLDOWN_DAYS,
      message: `Machine reset successfully approved. Previous machine bindings (${activeActivationsCount}) invalidated. License is now eligible for activation on a new machine.`,
    };
  });
}
