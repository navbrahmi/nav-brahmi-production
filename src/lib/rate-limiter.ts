import 'server-only';
import { prisma } from './prisma';

export interface RateLimitOptions {
  key: string;
  ip: string;
  limit: number;
  windowSeconds?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * DB-backed fixed-window rate limiter utilizing the RateLimitBucket table.
 * Avoids adding external vendor dependencies (Redis/Upstash).
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { key, ip, limit, windowSeconds = 60 } = options;
  const now = new Date();

  // Compute fixed window start timestamp (bucketed by windowSeconds)
  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(now.getTime() / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const resetAt = new Date(windowStartMs + windowMs);

  const compositeKey = `${key}:${ip.trim() || 'unknown'}`;

  // Atomic upsert with increment
  const bucket = await prisma.rateLimitBucket.upsert({
    where: {
      key_windowStart: {
        key: compositeKey,
        windowStart,
      },
    },
    update: {
      count: {
        increment: 1,
      },
    },
    create: {
      key: compositeKey,
      windowStart,
      count: 1,
    },
  });

  const remaining = Math.max(0, limit - bucket.count);
  const success = bucket.count <= limit;

  return {
    success,
    limit,
    remaining,
    resetAt,
  };
}
