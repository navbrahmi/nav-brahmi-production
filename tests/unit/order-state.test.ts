import { describe, it } from 'node:test';
import assert from 'node:assert';
import { OrderStatus } from '@prisma/client';
import {
  isValidOrderTransition,
  assertValidOrderTransition,
  IllegalOrderStateTransitionError,
} from '../../src/lib/order-state';

describe('Order State Machine Transitions (docs/production/06 §3)', () => {
  it('should allow happy-path sequential transitions', () => {
    assert.strictEqual(
      isValidOrderTransition(OrderStatus.CREATED, OrderStatus.PAYMENT_PENDING),
      true
    );
    assert.strictEqual(
      isValidOrderTransition(OrderStatus.PAYMENT_PENDING, OrderStatus.PAID),
      true
    );
    assert.strictEqual(
      isValidOrderTransition(OrderStatus.PAID, OrderStatus.LICENSE_ISSUED),
      true
    );
    assert.strictEqual(
      isValidOrderTransition(OrderStatus.LICENSE_ISSUED, OrderStatus.DELIVERED),
      true
    );
  });

  it('should allow idempotent self-transitions', () => {
    for (const status of Object.values(OrderStatus)) {
      assert.strictEqual(isValidOrderTransition(status, status), true);
    }
  });

  it('should reject illegal state jumps', () => {
    // Cannot jump straight from CREATED to PAID without gateway pending
    assert.strictEqual(isValidOrderTransition(OrderStatus.CREATED, OrderStatus.PAID), false);
    // Cannot jump straight from CREATED to DELIVERED
    assert.strictEqual(isValidOrderTransition(OrderStatus.CREATED, OrderStatus.DELIVERED), false);
    // Cannot jump from DELIVERED back to PAYMENT_PENDING
    assert.strictEqual(isValidOrderTransition(OrderStatus.DELIVERED, OrderStatus.PAYMENT_PENDING), false);
  });

  it('should throw IllegalOrderStateTransitionError on assertValidOrderTransition for illegal states', () => {
    assert.throws(
      () => assertValidOrderTransition(OrderStatus.CREATED, OrderStatus.DELIVERED),
      (err: any) => {
        assert.ok(err instanceof IllegalOrderStateTransitionError);
        assert.strictEqual(err.from, OrderStatus.CREATED);
        assert.strictEqual(err.to, OrderStatus.DELIVERED);
        return true;
      }
    );
  });

  it('should allow transition to failure/expiration from pending states', () => {
    assert.strictEqual(isValidOrderTransition(OrderStatus.CREATED, OrderStatus.EXPIRED), true);
    assert.strictEqual(isValidOrderTransition(OrderStatus.PAYMENT_PENDING, OrderStatus.FAILED), true);
    assert.strictEqual(isValidOrderTransition(OrderStatus.PAYMENT_PENDING, OrderStatus.EXPIRED), true);
    assert.strictEqual(isValidOrderTransition(OrderStatus.PAYMENT_PENDING, OrderStatus.PAYMENT_MISMATCH), true);
  });

  it('should treat REVOKED as a terminal state with no outbound transitions', () => {
    for (const status of Object.values(OrderStatus)) {
      if (status !== OrderStatus.REVOKED) {
        assert.strictEqual(isValidOrderTransition(OrderStatus.REVOKED, status), false);
      }
    }
  });
});
