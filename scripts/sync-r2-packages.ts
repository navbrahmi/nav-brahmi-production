import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { uploadObject, headObject } from '../src/lib/storage';

async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const dirArg = args.find((a) => !a.startsWith('--'));

  if (!dirArg) {
    console.error('Usage: tsx scripts/sync-r2-packages.ts <packages-directory> [--execute]');
    process.exit(1);
  }

  const dirPath = path.resolve(dirArg);
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  console.log(`Scanning directory: ${dirPath}`);
  console.log(`Execution Mode: ${isExecute ? 'EXECUTE (live sync)' : 'DRY-RUN (default)'}`);

  process.env.STORAGE_PROVIDER = 'r2';

  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = path.join(dirPath, entry.name);
      const data = fs.readFileSync(fullPath);
      const sizeBytes = data.length;
      const sha256 = crypto.createHash('sha256').update(data).digest('hex');
      const objectKey = `packages/${entry.name}`;

      console.log(`Found: ${objectKey} (${sizeBytes} bytes, SHA-256: ${sha256})`);

      if (isExecute) {
        const existing = await headObject(objectKey);
        if (existing && existing.sizeBytes === sizeBytes) {
          console.log(`  -> Skipping ${objectKey} (already up-to-date)`);
          continue;
        }

        console.log(`  -> Uploading ${objectKey}...`);
        await uploadObject(objectKey, data, 'application/octet-stream', { sha256 });
        console.log(`  -> Uploaded successfully.`);
      }
    }
  }

  if (!isExecute) {
    console.log('\nDRY-RUN COMPLETE. No objects were written. Run with --execute to apply changes.');
  }
}

main().catch((err) => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
