/**
 * Simple in-memory rate limiter.
 *
 * Not distributed — per-process state stored in a Map. Adequate for a single
 * Next.js server instance. For multi-instance deployments, swap for Redis.
 */

import { NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup to prevent unbounded growth.
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and increment a rate limit bucket.
 *
 * @param key Unique bucket key (e.g. `${ip}:${endpoint}`)
 * @param limit Maximum requests allowed per window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Extract a best-effort client IP from a NextRequest.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Convenience helper combining IP extraction, key building, and rate limiting.
 */
export function rateLimitRequest(
  request: NextRequest | Request,
  endpoint: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const ip = getClientIp(request);
  return rateLimit(`${ip}:${endpoint}`, limit, windowMs);
}
