import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  APP_BASE_URL: z.string().url('APP_BASE_URL must be a valid URL').optional(),
  LICENSE_SIGNING_PRIVATE_KEY: z.string().min(1, 'LICENSE_SIGNING_PRIVATE_KEY is required'),
  LICENSE_SIGNING_PUBLIC_KEY: z.string().min(1, 'LICENSE_SIGNING_PUBLIC_KEY is required').optional(),
  LICENSE_TOKEN_SECRET: z.string().min(16, 'LICENSE_TOKEN_SECRET must be at least 16 characters'),
  STORAGE_PROVIDER: z.enum(['b2', 'r2']).default('b2'),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // Legacy Backblaze B2
  B2_ENDPOINT: z.string().optional(),
  B2_REGION: z.string().optional(),
  B2_BUCKET_NAME: z.string().optional(),
  B2_KEY_ID: z.string().optional(),
  B2_APPLICATION_KEY: z.string().optional(),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Cron / Administration
  CRON_SECRET: z.string().optional(),

  // Email
  EMAIL_PROVIDER: z.enum(['resend', 'mock', 'dev']).default('mock'),
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  EMAIL_TEST_RECIPIENT: z.string().optional(),
  RESEND_TEST_EMAIL: z.string().optional(),

  // Local Testing Bypass
  DEMO_PAYMENT_BYPASS: z.string().optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_DEMO_PAYMENT_BYPASS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

let validatedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (validatedServerEnv) {
    return validatedServerEnv;
  }

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missingKeys = result.error.issues.map((issue) => issue.path.join('.'));
    // Security constraint: print missing variable NAMES only, NEVER values
    console.error(`FATAL: Environment validation failed. Missing or invalid variables: ${missingKeys.join(', ')}`);
    throw new Error(`Environment validation failed for variables: ${missingKeys.join(', ')}`);
  }

  validatedServerEnv = result.data;
  return validatedServerEnv;
}

export function getClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    const missingKeys = result.error.issues.map((issue) => issue.path.join('.'));
    throw new Error(`Client environment validation failed for: ${missingKeys.join(', ')}`);
  }

  return result.data;
}
