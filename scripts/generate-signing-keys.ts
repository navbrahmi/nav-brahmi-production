import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Key Generation Script for Ed25519 Signing Keys
 * 
 * Strict security constraints:
 * 1. Displays the PUBLIC key only.
 * 2. NEVER prints or logs the PRIVATE key to stdout or console.
 * 3. Can optionally write the private key to a local protected file specified via --out-private.
 */
function main() {
  console.log('====================================================');
  console.log(' Nav Brahmi Ed25519 Cryptographic Key Generator');
  console.log('====================================================\n');

  const keyPair = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const outPrivateArg = process.argv.indexOf('--out-private');
  let privateDestPath: string | null = null;
  if (outPrivateArg !== -1 && process.argv[outPrivateArg + 1]) {
    privateDestPath = path.resolve(process.cwd(), process.argv[outPrivateArg + 1]);
    fs.writeFileSync(privateDestPath, keyPair.privateKey, { mode: 0o600 });
  }

  console.log('✅ Fresh Ed25519 key pair successfully generated.');
  console.log('\n--- PUBLIC VERIFICATION KEY (Safe to share / embed in client) ---');
  console.log(keyPair.publicKey.trim());
  console.log('-----------------------------------------------------------------\n');

  console.log('SECURITY INSTRUCTIONS FOR PRIVATE SIGNING KEY:');
  if (privateDestPath) {
    console.log(`- Private key written to protected local file: ${privateDestPath} (chmod 600).`);
    console.log('- DO NOT commit this file to Git. Ensure it is included in .gitignore.');
  } else {
    console.log('- To save the private key directly to a file, re-run with:');
    console.log('    npx tsx scripts/generate-signing-keys.ts --out-private secrets/ed25519_private.pem');
  }

  console.log('- For server-side configuration, set the private key in your secure secret manager:');
  console.log('    LICENSE_SIGNING_PRIVATE_KEY="<private key pem>"');
  console.log('    LICENSE_SIGNING_PUBLIC_KEY="<public key pem>"');
  console.log('    LICENSE_SIGNING_KEY_ID="nav-brahmi-ed25519-v1"\n');
  console.log('⚠️  REMINDER: Never commit private keys or .env files to source control.');
}

main();
