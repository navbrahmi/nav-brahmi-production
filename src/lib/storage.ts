import 'server-only';
import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from './prisma';

export interface StorageConfig {
  provider: 'b2' | 'r2';
  bucketName: string;
  s3Client: S3Client;
}

let cachedStorage: StorageConfig | null = null;

export function getStorageClient(): StorageConfig {
  if (cachedStorage) {
    return cachedStorage;
  }

  const provider = (process.env.STORAGE_PROVIDER || 'b2').toLowerCase() as 'b2' | 'r2';

  if (provider === 'r2') {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('FATAL: Cloudflare R2 configuration is incomplete (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME).');
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    cachedStorage = { provider: 'r2', bucketName, s3Client };
    return cachedStorage;
  }

  // Confirmed storage provider: Backblaze B2 (Cloudflare R2 migration cancelled per client decision C-05)
  const rawEndpoint = process.env.B2_ENDPOINT || 's3.us-east-005.backblazeb2.com';
  const endpoint = rawEndpoint.startsWith('http') ? rawEndpoint : `https://${rawEndpoint}`;
  const region = process.env.B2_REGION || 'us-east-005';
  const bucketName = process.env.B2_BUCKET_NAME;
  const keyId = process.env.B2_KEY_ID;
  const applicationKey = process.env.B2_APPLICATION_KEY;

  if (!bucketName) {
    throw new Error('FATAL: B2_BUCKET_NAME environment variable is missing. Hardcoded demo fallbacks are prohibited.');
  }

  if (!keyId || !applicationKey) {
    throw new Error('FATAL: Backblaze B2 credentials missing (B2_KEY_ID, B2_APPLICATION_KEY).');
  }

  const s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: applicationKey,
    },
  });

  cachedStorage = { provider: 'b2', bucketName, s3Client };
  return cachedStorage;
}

/**
 * Generates a presigned GET URL for an object.
 * Enforces maximum TTL of 900 seconds (15 minutes).
 * Never logs URLs.
 */
export async function getPresignedGetUrl(objectKey: string, ttlSeconds: number = 900): Promise<string> {
  const effectiveTtl = Math.min(Math.max(1, ttlSeconds), 900); // 1s to 15m maximum
  const { s3Client, bucketName } = getStorageClient();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn: effectiveTtl });
}

/**
 * Checks whether an object exists and returns metadata.
 */
export async function headObject(objectKey: string): Promise<{ sizeBytes: number; sha256?: string } | null> {
  const { s3Client, bucketName } = getStorageClient();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const response = await s3Client.send(command);
    return {
      sizeBytes: response.ContentLength || 0,
      sha256: response.Metadata?.['sha256'],
    };
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') {
      return null;
    }
    throw err;
  }
}

/**
 * Upload helper used strictly by administration/sync scripts.
 */
export async function uploadObject(
  objectKey: string,
  data: Buffer,
  contentType: string = 'application/octet-stream',
  metadata?: Record<string, string>
): Promise<void> {
  const { s3Client, bucketName } = getStorageClient();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: data,
    ContentType: contentType,
    Metadata: metadata,
  });

  await s3Client.send(command);
}

/**
 * Resolves a package from the database.
 * Never defaults to Tamil Grantha or any other product!
 * Rejects unsupported architectures (arm64, ia64) per Task 3 and C-06.
 */
export async function resolveProductPackage(
  productCode: string,
  architecture: string = 'x64'
): Promise<{ objectKey: string; sha256: string; version: string; sizeBytes: bigint; productId: string }> {
  const rawArch = (architecture || 'x64').toLowerCase().trim();
  const normalizedArch = rawArch === 'amd64' ? 'x64' : rawArch === 'i386' ? 'x86' : rawArch;

  if (normalizedArch !== 'x64' && normalizedArch !== 'x86') {
    throw new Error(`Architecture "${architecture}" is not supported. Confirmed supported architectures are x64 and x86 (C-06).`);
  }

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { code: productCode.toUpperCase() },
        { slug: productCode.toLowerCase() },
        { id: productCode },
      ],
      isActive: true,
    },
    include: {
      packages: {
        where: {
          architecture: normalizedArch,
          isActive: true,
        },
      },
    },
  });

  if (!product || product.packages.length === 0) {
    throw new Error(`Product package not found for product "${productCode}" and architecture "${architecture}".`);
  }

  const pkg = product.packages[0];
  return {
    objectKey: pkg.objectKey,
    sha256: pkg.sha256,
    version: pkg.version,
    sizeBytes: pkg.sizeBytes,
    productId: product.id,
  };
}

