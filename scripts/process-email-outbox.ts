import { processEmailOutbox } from '../src/lib/email/outbox';

async function main() {
  console.log('[Email Outbox Runner] Starting email queue dispatch...');
  try {
    const result = await processEmailOutbox({ limit: 50 });
    console.log(
      `[Email Outbox Runner] Completed. Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}`
    );
    if (result.errors.length > 0) {
      console.warn('[Email Outbox Runner] Errors encountered:', result.errors);
    }
  } catch (err: any) {
    console.error('[Email Outbox Runner] Fatal error:', err.message);
    process.exit(1);
  }
}

main();
