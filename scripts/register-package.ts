import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getStorageClient } from '../src/lib/storage';
import { prisma } from '../src/lib/prisma';

try {
  process.loadEnvFile?.('.env');
} catch {}

/**
 * Additive Package Registration and Backblaze B2 Upload Engine
 * 
 * Satisfies all Task 4 requirements:
 * 1. Accepts explicitly selected local package file via --file.
 * 2. Validates inputs, product, and supported architectures (x64, x86 per C-06).
 * 3. Computes SHA-256 and byte size locally.
 * 4. DRY RUN BY DEFAULT: Requires explicit --upload flag to mutate B2 or DB.
 * 5. Verifies upload integrity before recording database rows.
 * 6. Never prints credentials or secret values.
 */
async function main() {
  const args = process.argv.slice(2);

  function getArg(flag: string): string | null {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  }

  const filePath = getArg('--file');
  const productArg = getArg('--product');
  const archArg = (getArg('--arch') || 'x64').toLowerCase();
  const version = getArg('--version') || '1.0.0';
  const isUpload = args.includes('--upload');
  const allowOverwrite = args.includes('--allow-overwrite');
  const isSynthetic = args.includes('--synthetic');

  console.log('====================================================');
  console.log(' Nav Brahmi Package Registration & B2 Delivery CLI');
  console.log('====================================================\n');

  if (!filePath || !productArg) {
    console.log('Usage:');
    console.log('  npx tsx scripts/register-package.ts --file <path> --product <code> --arch <x64|x86> [--version 1.0.0] [--upload] [--allow-overwrite]\n');
    console.log('Options:');
    console.log('  --file <path>       Absolute or relative path to local package archive (.zip)');
    console.log('  --product <code>    Product code, slug, or ID in database');
    console.log('  --arch <arch>       Target architecture: x64 or x86 (arm64/ia64 unapproved per C-06)');
    console.log('  --version <v>       Package semantic version (default: 1.0.0)');
    console.log('  --upload            Execute upload to Backblaze B2 and DB registration (default: DRY RUN)');
    console.log('  --allow-overwrite   Allow updating existing ProductPackage row if already registered');
    console.log('  --synthetic         Flag indicating a synthetic test fixture (bypasses C-05 NDA check)\n');
    process.exit(1);
  }

  const resolvedFile = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedFile)) {
    console.error(`❌ [ERROR] Target file does not exist: ${resolvedFile}`);
    process.exit(1);
  }

  // 1. Architecture Validation (C-06)
  const normalizedArch = archArg === 'amd64' ? 'x64' : archArg === 'i386' ? 'x86' : archArg;
  if (normalizedArch !== 'x64' && normalizedArch !== 'x86') {
    console.error(`❌ [ERROR] Unsupported architecture: "${archArg}". Supported architectures are x64 and x86 per C-06.`);
    process.exit(1);
  }

  // 2. Read file and compute local SHA-256 and size
  const fileBuffer = fs.readFileSync(resolvedFile);
  const sizeBytes = fileBuffer.length;
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // 3. Database Product Lookup
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { code: productArg.toUpperCase() },
        { slug: productArg.toLowerCase() },
        { id: productArg },
      ],
    },
  });

  if (!product) {
    console.error(`❌ [ERROR] Product not found in database for identifier: "${productArg}"`);
    process.exit(1);
  }

  const objectKey = `packages/${product.slug || (product.code ? product.code.toLowerCase() : 'pkg')}-${normalizedArch}-${version}.zip`;

  // 4. Check existing ProductPackage row
  const existingPkg = await prisma.productPackage.findUnique({
    where: {
      productId_architecture_version: {
        productId: product.id,
        architecture: normalizedArch,
        version,
      },
    },
  });

  if (existingPkg && !allowOverwrite) {
    console.error(`⚠️  [WARNING] Package already registered in database for ${product.name} (${normalizedArch} v${version}).`);
    console.error('Use --allow-overwrite if you explicitly intend to replace this package definition.');
    process.exit(1);
  }

  const storage = getStorageClient();

  console.log(`[TARGET] Product:        ${product.name} (${product.code || product.slug})`);
  console.log(`[TARGET] Architecture:   ${normalizedArch}`);
  console.log(`[TARGET] Version:        ${version}`);
  console.log(`[LOCAL]  Package:        ${path.basename(resolvedFile)}`);
  console.log(`[LOCAL]  Size:           ${sizeBytes} bytes`);
  console.log(`[LOCAL]  Integrity:      SHA-256 computed locally`);
  console.log(`[REMOTE] Object Key:     ${objectKey}`);
  console.log(`[STORAGE] Provider:      ${storage.provider.toUpperCase()} (Backblaze B2)`);
  console.log(`[STORAGE] Bucket:        ${storage.bucketName}\n`);

  // 5. DRY RUN CHECK
  if (!isUpload) {
    console.log('----------------------------------------------------');
    console.log(' [DRY RUN] Verification complete. No mutations performed.');
    console.log(' To execute Backblaze B2 upload and DB registration, re-run with:');
    console.log(`   npx tsx scripts/register-package.ts --file "${filePath}" --product "${productArg}" --arch "${normalizedArch}" --upload\n`);
    console.log('====================================================\n');
    return;
  }

  // 6. Safeguard against unconfirmed client NDA package upload (Rule 4 & C-05)
  const isRealClientFolder = resolvedFile.includes('/Requirements/Software/') || resolvedFile.includes('/Requirements/windows-driver/');
  if (isRealClientFolder && !isSynthetic && process.env.ALLOW_PROD_PACKAGE_UPLOAD !== 'true') {
    console.error('🛑 [BLOCKER] Real client proprietary packages cannot be uploaded without written client authorization (C-05).');
    console.error('For automated testing, use synthetic fixtures (--synthetic).');
    console.error('To proceed after obtaining explicit written client sign-off, set ALLOW_PROD_PACKAGE_UPLOAD=true.');
    process.exit(1);
  }

  // 7. Execute Upload to Backblaze B2
  console.log(`[UPLOAD] Uploading ${sizeBytes} bytes to ${storage.bucketName}/${objectKey}...`);
  const putCommand = new PutObjectCommand({
    Bucket: storage.bucketName,
    Key: objectKey,
    Body: fileBuffer,
    ContentType: 'application/zip',
    Metadata: {
      sha256,
      productId: product.id,
      architecture: normalizedArch,
      version,
    },
  });

  await storage.s3Client.send(putCommand);
  console.log('✅ [UPLOAD] Upload completed successfully.');

  // 8. Verify Upload via HeadObject
  console.log('[VERIFY] Verifying object presence and size in Backblaze B2...');
  const headRes = await storage.s3Client.send(
    new HeadObjectCommand({
      Bucket: storage.bucketName,
      Key: objectKey,
    })
  );

  if (headRes.ContentLength !== sizeBytes) {
    console.error(`❌ [VERIFY ERROR] Size mismatch in B2. Expected: ${sizeBytes}, Remote: ${headRes.ContentLength}`);
    process.exit(1);
  }
  console.log(`✅ [VERIFY] Object confirmed in Backblaze B2 (${headRes.ContentLength} bytes).`);

  // 9. Record / Upsert ProductPackage in Database
  console.log('[DATABASE] Recording ProductPackage in PostgreSQL...');
  await prisma.productPackage.upsert({
    where: {
      productId_architecture_version: {
        productId: product.id,
        architecture: normalizedArch,
        version,
      },
    },
    create: {
      productId: product.id,
      architecture: normalizedArch,
      version,
      objectKey,
      sha256,
      sizeBytes: BigInt(sizeBytes),
      isActive: true,
    },
    update: {
      objectKey,
      sha256,
      sizeBytes: BigInt(sizeBytes),
      isActive: true,
    },
  });

  console.log('✅ [DATABASE] ProductPackage successfully registered in Supabase PostgreSQL.');
  console.log('\n====================================================');
  console.log(' Package Registration & Delivery Completed Successfully!');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('\n❌ [FATAL ERROR]', err?.message || err);
  process.exit(1);
});
