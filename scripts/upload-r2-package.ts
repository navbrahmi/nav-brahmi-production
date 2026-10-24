import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { uploadObject, headObject } from '../src/lib/storage';

async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const fileArg = args.find((a) => !a.startsWith('--'));

  if (!fileArg) {
    console.error('Usage: tsx scripts/upload-r2-package.ts <file-path> [--execute] [--key <object-key>]');
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const keyIndex = args.indexOf('--key');
  const objectKey = keyIndex !== -1 && args[keyIndex + 1] ? args[keyIndex + 1] : path.basename(filePath);

  const fileData = fs.readFileSync(filePath);
  const sha256 = crypto.createHash('sha256').update(fileData).digest('hex');
  const sizeBytes = fileData.length;

  console.log(`Object Key: ${objectKey}`);
  console.log(`Size (bytes): ${sizeBytes}`);
  console.log(`Local SHA-256: ${sha256}`);
  console.log(`Mode: ${isExecute ? 'EXECUTE (live upload)' : 'DRY-RUN (no changes made)'}`);

  if (!isExecute) {
    console.log('Pass --execute to perform actual upload.');
    return;
  }

  // Set STORAGE_PROVIDER to r2
  process.env.STORAGE_PROVIDER = 'r2';

  console.log('Uploading object to Cloudflare R2...');
  await uploadObject(objectKey, fileData, 'application/octet-stream', { sha256 });
  console.log('Upload completed. Verifying via headObject...');

  const remote = await headObject(objectKey);
  if (!remote) {
    throw new Error('Verification failed: remote object could not be found.');
  }

  console.log(`Remote Object Verified: Size ${remote.sizeBytes} bytes.`);
}

main().catch((err) => {
  console.error('Upload failed:', err.message);
  process.exit(1);
});
