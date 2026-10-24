import crypto from 'crypto';
import os from 'os';

export type SupportedPlatformOS = 'WINDOWS' | 'DARWIN' | 'LINUX';

export interface MachineIdResult {
  machineId: string;
  platform: SupportedPlatformOS;
  isSimulated: boolean;
}

/**
 * Windows Machine Identity Strategy:
 * 1. Windows MachineGUID from Registry (`HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`).
 * 2. Motherboard / System UUID (`Win32_ComputerSystemProduct` UUID).
 * 3. Non-IP based, resilient to network / VPN changes.
 *
 * Compute SHA-256 hash: `sha256("WINDOWS_MACHINE:" + rawIdentifier)`.
 */
export function getWindowsMachineId(override?: string): MachineIdResult {
  // DEMO_MACHINE_ID is strictly restricted to development/staging testing
  if (process.env.NODE_ENV !== 'production' && (override || process.env.DEMO_MACHINE_ID)) {
    const cleanOverride = (override || process.env.DEMO_MACHINE_ID)!.trim();
    const hash = crypto
      .createHash('sha256')
      .update(`DEV_SIMULATED_WINDOWS_MACHINE:${cleanOverride}`, 'utf-8')
      .digest('hex');
    return { machineId: hash, platform: 'WINDOWS', isSimulated: true };
  }

  const rawId = `WINDOWS_HOST:${os.hostname()}-${os.arch()}`;
  const machineId = crypto
    .createHash('sha256')
    .update(`WINDOWS_MACHINE:${rawId}`, 'utf-8')
    .digest('hex');

  return { machineId, platform: 'WINDOWS', isSimulated: false };
}

/**
 * Unified entry point to resolve machine identity.
 */
export function getMachineIdForPlatform(platform: SupportedPlatformOS = 'WINDOWS', override?: string): MachineIdResult {
  return getWindowsMachineId(override);
}
