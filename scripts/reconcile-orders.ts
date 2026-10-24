import { reconcileOrders } from '../src/lib/reconciliation';

async function main() {
  console.log('[Order Reconciler] Starting order reconciliation run...');
  try {
    const result = await reconcileOrders({ olderThanMinutes: 15 });
    console.log(
      `[Order Reconciler] Completed. Examined: ${result.examined}, Reconciled: ${result.reconciled}, Unresolved: ${result.unresolved}`
    );
    if (result.errors.length > 0) {
      console.warn('[Order Reconciler] Errors encountered:', result.errors);
    }
  } catch (err: any) {
    console.error('[Order Reconciler] Fatal error:', err.message);
    process.exit(1);
  }
}

main();
