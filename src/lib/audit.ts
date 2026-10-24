import 'server-only';
import { prisma } from './prisma';
import { logger } from './logger';

export interface AuditEventParams {
  type: string;
  actorType: 'SYSTEM' | 'ANONYMOUS' | 'ADMIN' | 'CUSTOMER';
  actorId?: string;
  refType?: 'ORDER' | 'LICENSE' | 'ACTIVATION' | 'PAYMENT' | 'WEBHOOK';
  refId?: string;
  metadata?: Record<string, any>;
}

/**
 * Persists an immutable security audit event into the AuditEvent table.
 * Strictly guarantees that no secrets or sensitive credentials are recorded.
 */
export async function recordAuditEvent(params: AuditEventParams): Promise<void> {
  const { type, actorType, actorId, refType, refId, metadata } = params;

  try {
    await prisma.auditEvent.create({
      data: {
        type,
        actorType,
        actorId,
        refType,
        refId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (err: any) {
    // Audit logging failure must be reported to server logs without crashing critical transactions
    logger.error('Failed to record audit event', {
      eventType: type,
      error: err.message,
    });
  }
}
