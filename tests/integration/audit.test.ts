import { describe, it } from 'node:test';
import assert from 'node:assert';
import { recordAuditEvent } from '../../src/lib/audit';
import { prisma } from '../../src/lib/prisma';

describe('Audit Event Helper', () => {
  it('should persist audit trail records with redacted metadata', async () => {
    const testId = `ord_test_${Date.now()}`;
    await recordAuditEvent({
      type: 'ORDER_CREATED',
      actorType: 'CUSTOMER',
      actorId: 'cust_123',
      refType: 'ORDER',
      refId: testId,
      metadata: {
        productCode: 'TAMIL-GRANTHA',
        customerEmail: 'customer@example.com',
        amountMinor: 48000,
      },
    });

    const recorded = await prisma.auditEvent.findFirst({
      where: {
        refId: testId,
      },
    });

    assert.ok(recorded);
    assert.strictEqual(recorded.type, 'ORDER_CREATED');
    assert.strictEqual(recorded.actorType, 'CUSTOMER');
    assert.strictEqual(recorded.refType, 'ORDER');

    const meta = recorded.metadata as any;
    assert.strictEqual(meta.productCode, 'TAMIL-GRANTHA');
    assert.strictEqual(meta.amountMinor, 48000);
  });
});
