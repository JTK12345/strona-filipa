import { createHash } from "node:crypto";
import { securityConfig } from "@/app/api/_utils/security-config";

type RateLimitStoreRecord = {
  count: number;
  resetAt: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
  headers: Headers;
};

type RateLimitOptions = {
  endpointLimit?: number;
  globalLimit?: number;
  windowMs?: number;
};

const rateLimitStore = new Map<string, RateLimitStoreRecord>();
const maximumStoreEntries = 5000;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function cleanupExpiredEntries(now: number) {
  if (rateLimitStore.size < maximumStoreEntries) {
    return;
  }

  for (const [key, record] of rateLimitStore) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function increment(namespace: string, fingerprint: string, windowMs: number) {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const key = `${namespace}:${fingerprint}`;
  const current = rateLimitStore.get(key);

  if (!current && rateLimitStore.size >= maximumStoreEntries) {
    return {
      count: Number.MAX_SAFE_INTEGER,
      resetAt: now + windowMs,
    };
  }

  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    rateLimitStore.set(key, next);
    return next;
  }

  current.count += 1;
  return current;
}

export function getRateLimitFingerprint(ip: string, _userAgent: string) {
  void _userAgent;
  return sha256(ip || "unknown");
}

function createHeaders(
  limit: number,
  remaining: number,
  retryAfterSeconds: number,
  allowed: boolean,
) {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", String(limit));
  headers.set("X-RateLimit-Remaining", String(Math.max(remaining, 0)));

  if (!allowed) {
    headers.set("Retry-After", String(retryAfterSeconds));
  }

  return headers;
}

export async function checkRateLimit(
  endpoint: string,
  fingerprint: string,
  options: RateLimitOptions = {},
): Promise<RateLimitDecision> {
  const windowMs = options.windowMs ?? securityConfig.rateLimitWindowMs;
  const endpointLimit =
    options.endpointLimit ?? securityConfig.endpointRateLimit;
  const globalLimit = options.globalLimit ?? securityConfig.globalRateLimit;
  const globalRecord = increment("global", fingerprint, windowMs);
  const endpointRecord = increment(endpoint, fingerprint, windowMs);
  const globalRemaining = globalLimit - globalRecord.count;
  const endpointRemaining = endpointLimit - endpointRecord.count;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil(
      (Math.max(globalRecord.resetAt, endpointRecord.resetAt) - Date.now()) /
        1000,
    ),
  );
  const allowed =
    globalRecord.count <= globalLimit &&
    endpointRecord.count <= endpointLimit;

  return {
    allowed,
    retryAfterSeconds,
    headers: createHeaders(
      endpointLimit,
      Math.min(globalRemaining, endpointRemaining),
      retryAfterSeconds,
      allowed,
    ),
  };
}
