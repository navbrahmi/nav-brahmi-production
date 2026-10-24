import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function main() {
  const targetPath = process.argv[2];
  if (!targetPath) {
    console.error('Usage: tsx scripts/generate-keys.ts <absolute-output-path-outside-repo>');
    process.exit(1);
  }

  const resolvedTarget = path.resolve(targetPath);
  const repoRoot = path.resolve(__dirname, '..');

  // Refuse paths inside repository
  if (resolvedTarget.startsWith(repoRoot)) {
    console.error(`ERROR: Target path "${resolvedTarget}" is inside repository "${repoRoot}". Refusing to write private key.`);
    process.exit(1);
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // Ensure parent directory exists
  const parentDir = path.dirname(resolvedTarget);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Write private key with strict mode 0600
  fs.writeFileSync(resolvedTarget, privateKey, { mode: 0o600 });

  console.log('=== ED25519 PUBLIC VERIFICATION KEY ===');
  console.log(publicKey);
  console.log('=======================================');
  console.log(`Private key written to: ${resolvedTarget} (mode 0600)`);
  console.log('INSTRUCTION: Move the private key into your secure secret store (LICENSE_SIGNING_PRIVATE_KEY) and delete the file.');
}

if (require.main === module) {
  main();
}
