import { OrderStatus } from '@prisma/client';

/**
 * Valid transitions between OrderStatus states according to docs/production/06 §3.
 *
 * State diagram:
 * CREATED → PAYMENT_PENDING → PAID → LICENSE_ISSUED → DELIVERED
 *    │             │            │
 *    └→ EXPIRED    └→ FAILED    └→ (issue failure → NEEDS_ATTENTION)
 * DELIVERED/LICENSE_ISSUED → REFUNDED | DISPUTED → REVOKED (per policy)
 */
export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  CREATED: [OrderStatus.PAYMENT_PENDING, OrderStatus.FAILED, OrderStatus.EXPIRED],
  PAYMENT_PENDING: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_MISMATCH,
    OrderStatus.FAILED,
    OrderStatus.EXPIRED,
    OrderStatus.NEEDS_ATTENTION,
  ],
  PAID: [
    OrderStatus.LICENSE_ISSUED,
    OrderStatus.NEEDS_ATTENTION,
    OrderStatus.REFUNDED,
  ],
  LICENSE_ISSUED: [
    OrderStatus.DELIVERED,
    OrderStatus.REFUNDED,
    OrderStatus.DISPUTED,
    OrderStatus.REVOKED,
    OrderStatus.NEEDS_ATTENTION,
  ],
  DELIVERED: [
    OrderStatus.REFUNDED,
    OrderStatus.DISPUTED,
    OrderStatus.REVOKED,
    OrderStatus.NEEDS_ATTENTION,
  ],
  NEEDS_ATTENTION: [
    OrderStatus.PAID,
    OrderStatus.LICENSE_ISSUED,
    OrderStatus.DELIVERED,
    OrderStatus.REFUNDED,
    OrderStatus.DISPUTED,
    OrderStatus.REVOKED,
    OrderStatus.FAILED,
  ],
  PAYMENT_MISMATCH: [
    OrderStatus.NEEDS_ATTENTION,
    OrderStatus.REFUNDED,
    OrderStatus.FAILED,
  ],
  REFUNDED: [OrderStatus.REVOKED],
  DISPUTED: [OrderStatus.REVOKED, OrderStatus.REFUNDED, OrderStatus.NEEDS_ATTENTION],
  REVOKED: [], // Terminal
  FAILED: [OrderStatus.PAYMENT_PENDING], // Allows customer retry from beginning
  EXPIRED: [OrderStatus.PAYMENT_PENDING], // Allows customer retry
};

export class IllegalOrderStateTransitionError extends Error {
  constructor(public readonly from: OrderStatus, public readonly to: OrderStatus) {
    super(`Illegal order state transition from "${from}" to "${to}".`);
    this.name = 'IllegalOrderStateTransitionError';
  }
}

/**
 * Checks whether an order status transition is allowed.
 * Identity transitions (from === to) are considered idempotent and allowed.
 */
export function isValidOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_ORDER_TRANSITIONS[from];
  return Boolean(allowed && allowed.includes(to));
}

/**
 * Asserts that a state transition is valid, throwing an IllegalOrderStateTransitionError if not.
 */
export function assertValidOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!isValidOrderTransition(from, to)) {
    throw new IllegalOrderStateTransitionError(from, to);
  }
}
