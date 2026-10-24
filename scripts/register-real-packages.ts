import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { HeadObjectCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getStorageClient } from '../src/lib/storage';
import { prisma } from '../src/lib/prisma';

interface ProductMapping {
  slug: string;
  code: string;
  folderName: string;
  msklcFolder: string;
  isResolved: boolean;
  unresolvedReason?: string;
}

const PRODUCT_MAPPINGS: ProductMapping[] = [
  // 10 Products with 1:1 evidence
  { slug: 'ashokan-brahmi', code: 'ASHOKAN_BRAHMI', folderName: 'Ashokan Brahmi', msklcFolder: 'Ashokan Brahmi', isResolved: true },
  { slug: 'bengali', code: 'BENGALI', folderName: 'Bengali', msklcFolder: 'Bengali', isResolved: true },
  { slug: 'devanagari-hindi', code: 'DEVANAGARI_HINDI', folderName: 'Devanagari', msklcFolder: 'Devanagari', isResolved: true },
  { slug: 'gujarati', code: 'GUJARATI', folderName: 'Gujarati', msklcFolder: 'Gujarati', isResolved: true },
  { slug: 'malayalam', code: 'MALAYALAM', folderName: 'Malayalam', msklcFolder: 'Malayalam', isResolved: true },
  { slug: 'modi-marathi', code: 'MODI_MARATHI', folderName: 'Modi-Marathi', msklcFolder: 'Modi-Marathi', isResolved: true },
  { slug: 'oriya-odia', code: 'ORIYA_ODIA', folderName: 'Oriya-Odia', msklcFolder: 'Odia', isResolved: true },
  { slug: 'punjabi-gurmukhi', code: 'PUNJABI_GURMUKHI', folderName: 'Punjabi-Gurumuki', msklcFolder: 'Punjabi-Gurumuki', isResolved: true },
  { slug: 'sharada', code: 'SHARADA', folderName: 'Sharada', msklcFolder: 'Sharada', isResolved: true },
  { slug: 'telugu', code: 'TELUGU', folderName: 'Telugu', msklcFolder: 'Telugu', isResolved: true },

  // Unresolved Products pending client decision C-03
  {
    slug: 'kannada',
    code: 'KANNADA',
    folderName: 'Kannada',
    msklcFolder: 'Kannada',
    isResolved: false,
    unresolvedReason: 'Blocked by C-03: Category 5 in agreement is "Kannada, Tulu and Devanagari". Delivered as two separate folders (Kannada, Tulu). Client must confirm whether sold as single bundle or separate products.',
  },
  {
    slug: 'tulu',
    code: 'TULU',
    folderName: 'Tulu',
    msklcFolder: 'Tulu',
    isResolved: false,
    unresolvedReason: 'Blocked by C-03: Category 12 is "Tulu and Devanagari" while Category 5 includes Tulu. Client must confirm if separate catalog entry exists.',
  },
  {
    slug: 'tamil-and-grantha',
    code: 'TAMIL_AND_GRANTHA',
    folderName: 'Tamil',
    msklcFolder: 'Tamil',
    isResolved: false,
    unresolvedReason: 'Blocked by C-03: Category 10 is "Tamil and Tamil Grantha". Delivered as two separate folders ("Tamil" and "Tamil Grantha"). Client must confirm whether bundled into one package or split into two products.',
  },
];

async function main() {
  console.log('================================================================');
  console.log(' Nav Brahmi — Real Software Package B2 Upload & Registration');
  console.log('================================================================\n');

  // Step A: Storage Destination Verification
  const storage = getStorageClient();
  const bucketName = storage.bucketName;
  const endpoint = process.env.B2_ENDPOINT || 's3.us-east-005.backblazeb2.com';

  console.log(`[STORAGE] Provider:      ${storage.provider.toUpperCase()} (Backblaze B2)`);
  console.log(`[STORAGE] Bucket:        ${bucketName}`);
  console.log(`[STORAGE] Endpoint:      ${endpoint}`);

  if (bucketName !== 'navbrahmi-prod-packages') {
    throw new Error(`CRITICAL: Storage destination is '${bucketName}', expected 'navbrahmi-prod-packages'. Halting real package upload.`);
  }
  if (bucketName.toLowerCase().includes('backup') || bucketName.toLowerCase().includes('velero')) {
    throw new Error(`CRITICAL: Bucket appears to be a backup/velero bucket. Halting upload.`);
  }
  console.log('✓ Storage destination verified: strictly target private software bucket.\n');

  // Scratch directory for deterministic packaging
  const scratchDir = path.resolve(process.cwd(), '.scratch-packaging');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const results: {
    uploadedPackages: { slug: string; arch: string; size: number; objectKey: string }[];
    blockedPackages: { slug: string; reason: string }[];
  } = {
    uploadedPackages: [],
    blockedPackages: [],
  };

  const softwareBase = path.resolve(process.cwd(), 'Requirements', 'Software');

  for (const mapping of PRODUCT_MAPPINGS) {
    if (!mapping.isResolved) {
      console.log(`[BLOCKED] ${mapping.slug} (${mapping.code})`);
      console.log(`  Reason: ${mapping.unresolvedReason}\n`);
      results.blockedPackages.push({ slug: mapping.slug, reason: mapping.unresolvedReason! });
      continue;
    }

    // Lookup product in database
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug: mapping.slug }, { code: mapping.code }],
      },
    });

    if (!product) {
      throw new Error(`Product record not found in database for ${mapping.slug} (${mapping.code})`);
    }

    const packageDir = path.join(softwareBase, mapping.folderName, mapping.msklcFolder);
    if (!fs.existsSync(packageDir)) {
      throw new Error(`MSKLC directory not found: ${packageDir}`);
    }

    // Supported architectures per C-06 & docs/07: x64 (amd64) and x86 (i386)
    const architectures = ['x64', 'x86'];

    for (const arch of architectures) {
      const zipFileName = `${product.slug}-${arch}-1.0.0.zip`;
      const localZipPath = path.join(scratchDir, zipFileName);
      if (fs.existsSync(localZipPath)) {
        fs.unlinkSync(localZipPath);
      }

      console.log(`[PACKAGING] ${product.slug} (${arch})`);

      // Package deterministic zip for this architecture
      // For x64: include *_amd64.msi, amd64/, wow64/, setup.exe (if exists)
      // For x86: include *_i386.msi, i386/, setup.exe (if exists)
      const filesToZip: string[] = [];
      const dirEntries = fs.readdirSync(packageDir);

      for (const entry of dirEntries) {
        const fullEntryPath = path.join(packageDir, entry);
        const lower = entry.toLowerCase();

        if (arch === 'x64') {
          if (lower.endsWith('_amd64.msi') || lower === 'amd64' || lower === 'wow64' || lower === 'setup.exe') {
            filesToZip.push(entry);
          }
        } else if (arch === 'x86') {
          if (lower.endsWith('_i386.msi') || lower === 'i386' || lower === 'setup.exe') {
            filesToZip.push(entry);
          }
        }
      }

      // Check for allowlisted fonts in packageDir or parent folder
      const parentDir = path.dirname(packageDir);
      for (const fontName of ['navbrahmi-regular.ttf', 'navbrahmi-bold.ttf']) {
        if (fs.existsSync(path.join(packageDir, fontName))) {
          filesToZip.push(fontName);
        } else if (fs.existsSync(path.join(parentDir, fontName))) {
          // Copy temporarily into packageDir for inclusion
          fs.copyFileSync(path.join(parentDir, fontName), path.join(packageDir, fontName));
          filesToZip.push(fontName);
        }
      }

      if (filesToZip.length === 0) {
        throw new Error(`No files found matching architecture ${arch} in ${packageDir}`);
      }

      // Build zip using zip CLI
      const zipCmd = `zip -r -q "${localZipPath}" ${filesToZip.map((f) => `"${f}"`).join(' ')}`;
      execSync(zipCmd, { cwd: packageDir, stdio: 'pipe' });

      if (!fs.existsSync(localZipPath)) {
        throw new Error(`Failed to create package zip: ${localZipPath}`);
      }

      // Calculate SHA-256 and size locally (without logging secrets or paths)
      const fileBuffer = fs.readFileSync(localZipPath);
      const sizeBytes = fileBuffer.length;
      const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const objectKey = `packages/${zipFileName}`;

      console.log(`  ✓ Built package (${sizeBytes} bytes, SHA-256 computed)`);

      // Upload original bytes to private Backblaze B2 bucket
      console.log(`  -> Uploading to B2 key: ${objectKey}...`);
      await storage.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          Body: fileBuffer,
          ContentType: 'application/zip',
        })
      );

      // Verify uploaded object against original file via HeadObjectCommand
      const headRes = await storage.s3Client.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        })
      );

      if (headRes.ContentLength !== sizeBytes) {
        throw new Error(`Remote size mismatch for ${objectKey}: remote=${headRes.ContentLength}, local=${sizeBytes}`);
      }

      // Verify SHA-256 of uploaded object
      const getRes = await storage.s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        })
      );
      const downloadedBytes: Buffer = await new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        (getRes.Body as any).on('data', (chunk: Buffer) => chunks.push(chunk));
        (getRes.Body as any).on('end', () => resolve(Buffer.concat(chunks)));
        (getRes.Body as any).on('error', reject);
      });

      const downloadedSha256 = crypto.createHash('sha256').update(downloadedBytes).digest('hex');
      if (downloadedSha256 !== sha256) {
        throw new Error(`Cryptographic hash mismatch for uploaded B2 object: ${objectKey}`);
      }
      console.log(`  ✓ Verified remote object matches local bytes and SHA-256 exactly.`);

      // Register or update ProductPackage database record ONLY after successful upload and verification
      const registeredPackage = await prisma.productPackage.upsert({
        where: {
          productId_architecture_version: {
            productId: product.id,
            architecture: arch,
            version: '1.0.0',
          },
        },
        create: {
          productId: product.id,
          architecture: arch,
          version: '1.0.0',
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

      console.log(`  ✓ Registered ProductPackage row (ID: ${registeredPackage.id})\n`);
      results.uploadedPackages.push({
        slug: product.slug || product.code || '',
        arch,
        size: sizeBytes,
        objectKey,
      });

      // Cleanup local scratch zip
      if (fs.existsSync(localZipPath)) {
        fs.unlinkSync(localZipPath);
      }
    }
  }

  // Remove scratch packaging directory
  if (fs.existsSync(scratchDir)) {
    fs.rmSync(scratchDir, { recursive: true, force: true });
  }

  console.log('================================================================');
  console.log(`Summary:`);
  console.log(`  Successfully uploaded and registered packages: ${results.uploadedPackages.length}`);
  console.log(`  Products covered: 10 (20 per-architecture packages: 10 x64 + 10 x86)`);
  console.log(`  Blocked items: ${results.blockedPackages.length} (pending client decision C-03)`);
  console.log('================================================================\n');

  return results;
}

if (process.argv[1]?.endsWith('register-real-packages.ts')) {
  main()
    .catch((err) => {
      console.error('❌ [FATAL ERROR]', err.message);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
