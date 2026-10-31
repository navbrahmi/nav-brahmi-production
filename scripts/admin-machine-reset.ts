import { executeSupportMachineReset, AdminResetError } from '../src/lib/admin-reset';
import { prisma } from '../src/lib/prisma';

try {
  process.loadEnvFile?.('.env');
} catch {}

async function main() {
  const args = process.argv.slice(2);

  function getArg(flag: string): string | null {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  }

  const licenseArg = getArg('--license') || getArg('--order');
  const refArg = getArg('--ref') || getArg('--ticket');
  const reasonArg = getArg('--reason');
  const actorArg = getArg('--actor') || 'cli-admin';
  const overrideCooldown = args.includes('--override');
  const overrideReason = getArg('--override-reason') || (overrideCooldown ? 'Administrative override approved by ops' : undefined);

  if (!licenseArg || !refArg || !reasonArg) {
    console.log('================================================================');
    console.log(' Nav Brahmi — Support-Assisted Machine Reset CLI (C-07)');
    console.log('================================================================\n');
    console.log('Usage:');
    console.log('  npx tsx scripts/admin-machine-reset.ts --license <id|orderToken> --ref <ticketId> --reason <text> [--override --override-reason <text>]\n');
    console.log('Options:');
    console.log('  --license <id>           License ID, order ID, or order publicToken');
    console.log('  --ref <ticket>           Verified support approval reference (e.g. SUP-104)');
    console.log('  --reason <text>          Documented reason for machine reset');
    console.log('  --actor <id>             Support agent identifier (default: cli-admin)');
    console.log('  --override               Bypass 90-day cooldown period (requires reason)');
    console.log('  --override-reason <text> Documented justification for cooldown override\n');
    process.exit(1);
  }

  try {
    const result = await executeSupportMachineReset({
      licenseIdentifier: licenseArg,
      supportApprovalRef: refArg,
      reason: reasonArg,
      actorId: actorArg,
      overrideCooldown,
      overrideReason,
    });

    console.log('✅ [SUCCESS] Support machine reset executed successfully:');
    console.log(`  License ID:           ${result.licenseId}`);
    console.log(`  Product:              ${result.productName}`);
    console.log(`  Invalidated Machines: ${result.invalidatedActivationsCount}`);
    console.log(`  Reset Count:          ${result.resetCount}`);
    console.log(`  Reset Timestamp:      ${result.lastResetAt.toISOString()}`);
    console.log(`  Message:              ${result.message}`);
  } catch (err: any) {
    if (err instanceof AdminResetError) {
      console.error(`❌ [RESET REJECTED - ${err.code}]: ${err.message}`);
    } else {
      console.error('❌ [ERROR]', err.message || err);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith('admin-machine-reset.ts')) {
  main();
}
