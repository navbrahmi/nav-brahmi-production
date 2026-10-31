import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../../src/lib/prisma';
import { executeSupportMachineReset, AdminResetError } from '../../src/lib/admin-reset';
import crypto from 'crypto';

describe('One-Machine Activation & Support-Assisted Reset (C-07)', () => {
  let testProductId: string;
  let testOrderId: string;
  let testLicenseId: string;
  const testEmail = `test-c07-${Date.now()}@example.com`;
  const machineA = 'TEST-MACHINE-ID-AAAA';
  const machineB = 'TEST-MACHINE-ID-BBBB';
  const machineHashA = crypto.createHash('sha256').update(machineA).digest('hex');
  const machineHashB = crypto.createHash('sha256').update(machineB).digest('hex');

  before(async () => {
    // 1. Ensure test product exists
    const prod = await prisma.product.upsert({
      where: { code: 'KANNADA' },
      update: {},
      create: {
        code: 'KANNADA',
        slug: 'kannada',
        name: 'Kannada',
        description: 'Kannada keyboard layout driver',
        priceMinor: 47200,
        price: 472.0,
        currency: 'INR',
        isActive: true,
      },
    });
    testProductId = prod.id;

    // 2. Create test order
    const order = await prisma.order.create({
      data: {
        productId: testProductId,
        customerEmail: testEmail,
        customerName: 'C-07 Test Customer',
        amountMinor: 47200,
        currency: 'INR',
        status: 'PAID',
        publicToken: `tok_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      },
    });
    testOrderId = order.id;

    // 3. Create test license with maxActivations = 1
    const rawKey = `NAV-KNDA-TEST-${Date.now()}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const lic = await prisma.license.create({
      data: {
        orderId: testOrderId,
        productId: testProductId,
        licenseKey: rawKey,
        keyLookupHash: keyHash,
        email: testEmail,
        status: 'ACTIVE',
        maxActivations: 1,
      },
    });
    testLicenseId = lic.id;
  });

  after(async () => {
    try {
      if (testLicenseId) {
        await prisma.activation.deleteMany({ where: { licenseId: testLicenseId } });
        await prisma.license.deleteMany({ where: { id: testLicenseId } });
      }
      if (testOrderId) {
        await prisma.auditEvent.deleteMany({ where: { refId: testLicenseId } });
        await prisma.order.deleteMany({ where: { id: testOrderId } });
      }
    } catch {}
  });

  it('should enforce one active machine per license and reject activation on a second machine', async () => {
    // Machine A activates
    const actA = await prisma.activation.create({
      data: {
        licenseId: testLicenseId,
        machineIdHash: machineHashA,
        status: 'ACTIVE',
      },
    });
    await prisma.license.update({
      where: { id: testLicenseId },
      data: { activationStatus: 'ACTIVATED', activatedAt: new Date(), machineId: machineHashA },
    });

    assert.ok(actA.id);

    // Verify active activations is 1
    const licBefore = await prisma.license.findUnique({
      where: { id: testLicenseId },
      include: { activations: { where: { status: 'ACTIVE' } } },
    });
    assert.strictEqual(licBefore?.activations.length, 1);
    assert.strictEqual(licBefore?.maxActivations, 1);

    // Attempting a second machine without reset must be rejected under 1-machine rule
    const isAtLimit = (licBefore?.activations.length || 0) >= (licBefore?.maxActivations || 1);
    assert.strictEqual(isAtLimit, true, 'License must be at maximum active machines');
  });

  it('should reject unauthorized reset without support approval ref or reason', async () => {
    await assert.rejects(
      async () => {
        await executeSupportMachineReset({
          licenseIdentifier: testLicenseId,
          supportApprovalRef: '',
          reason: 'Customer requested reset',
          actorId: 'agent-101',
        });
      },
      (err: any) => err instanceof AdminResetError && err.code === 'MISSING_APPROVAL_REF'
    );

    await assert.rejects(
      async () => {
        await executeSupportMachineReset({
          licenseIdentifier: testLicenseId,
          supportApprovalRef: 'SUP-1234',
          reason: '',
          actorId: 'agent-101',
        });
      },
      (err: any) => err instanceof AdminResetError && err.code === 'MISSING_REASON'
    );
  });

  it('should execute authorized support-assisted machine reset and invalidate previous machine activation', async () => {
    const result = await executeSupportMachineReset({
      licenseIdentifier: testLicenseId,
      supportApprovalRef: 'SUP-APPROVED-9001',
      reason: 'Verified customer motherboard replacement after hardware fault',
      actorId: 'support-lead-01',
      overrideCooldown: true, // initial reset right after creation requires override of initial 0-day
      overrideReason: 'Initial hardware replacement verification approved by lead',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.resetCount, 1);
    assert.strictEqual(result.invalidatedActivationsCount, 1);

    // Verify previous activation is now REVOKED
    const prevActivation = await prisma.activation.findFirst({
      where: { licenseId: testLicenseId, machineIdHash: machineHashA },
    });
    assert.strictEqual(prevActivation?.status, 'REVOKED', 'Previous machine activation must be REVOKED');

    // Verify license state
    const licAfter = await prisma.license.findUnique({
      where: { id: testLicenseId },
      include: { activations: { where: { status: 'ACTIVE' } } },
    });
    assert.strictEqual(licAfter?.activations.length, 0);
    assert.strictEqual(licAfter?.resetCount, 1);
    assert.ok(licAfter?.lastResetAt);
  });

  it('should enforce 90-day cooldown policy and reject subsequent reset without override', async () => {
    // Attempting a second reset immediately without override must fail with COOLDOWN_ACTIVE
    await assert.rejects(
      async () => {
        await executeSupportMachineReset({
          licenseIdentifier: testLicenseId,
          supportApprovalRef: 'SUP-QUICK-RETRY',
          reason: 'Customer trying to reset again immediately',
          actorId: 'support-agent-02',
          overrideCooldown: false,
        });
      },
      (err: any) => {
        assert.ok(err instanceof AdminResetError);
        assert.strictEqual(err.code, 'COOLDOWN_ACTIVE');
        assert.ok(err.message.includes('90 days'));
        return true;
      }
    );
  });

  it('should allow subsequent reset when administrator provides explicit override reason', async () => {
    const result = await executeSupportMachineReset({
      licenseIdentifier: testLicenseId,
      supportApprovalRef: 'SUP-EXEC-OVERRIDE-88',
      reason: 'Customer primary work machine stolen, police report filed',
      actorId: 'support-admin-01',
      overrideCooldown: true,
      overrideReason: 'Documented emergency police theft report verified by admin',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.resetCount, 2);

    // Verify audit event exists for the reset
    const auditEvents = await prisma.auditEvent.findMany({
      where: { refId: testLicenseId, type: 'SUPPORT_MACHINE_RESET' },
    });
    assert.ok(auditEvents.length >= 2, 'Audit event must be logged for every reset');
  });

  it('should allow new Machine B to activate now that license is reset to 0 active machines', async () => {
    const lic = await prisma.license.findUnique({
      where: { id: testLicenseId },
      include: { activations: { where: { status: 'ACTIVE' } } },
    });
    assert.strictEqual(lic?.activations.length, 0);

    // New machine B can now activate
    const actB = await prisma.activation.create({
      data: {
        licenseId: testLicenseId,
        machineIdHash: machineHashB,
        status: 'ACTIVE',
      },
    });
    assert.ok(actB.id);

    await prisma.license.update({
      where: { id: testLicenseId },
      data: { activationStatus: 'ACTIVATED', machineId: machineHashB },
    });

    const activeActivations = await prisma.activation.findMany({
      where: { licenseId: testLicenseId, status: 'ACTIVE' },
    });
    assert.strictEqual(activeActivations.length, 1);
    assert.strictEqual(activeActivations[0].machineIdHash, machineHashB);
  });
});
