import assert from "node:assert/strict";
import test from "node:test";
import {
  checkRateLimit,
  cleanupRateLimitStoreForTests,
  getRateLimitStoreSize,
  getRateLimitFingerprint,
  resetRateLimitStoreForTests,
} from "../app/api/_utils/rateLimiter";

test("rate limits a stable IP even when the user agent changes", async () => {
  resetRateLimitStoreForTests();
  const firstFingerprint = getRateLimitFingerprint(
    "203.0.113.10",
    "browser-one",
  );
  const secondFingerprint = getRateLimitFingerprint(
    "203.0.113.10",
    "browser-two",
  );

  assert.equal(firstFingerprint, secondFingerprint);

  const namespace = `test-${Date.now()}`;
  const first = await checkRateLimit(namespace, firstFingerprint, {
    endpointLimit: 2,
    globalLimit: 100,
  });
  const second = await checkRateLimit(namespace, secondFingerprint, {
    endpointLimit: 2,
    globalLimit: 100,
  });
  const third = await checkRateLimit(namespace, firstFingerprint, {
    endpointLimit: 2,
    globalLimit: 100,
  });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.equal(first.headers.has("Retry-After"), false);
  assert.equal(third.headers.has("Retry-After"), true);
});

test("expired rate-limit entries are cleared and the limit resets", async () => {
  resetRateLimitStoreForTests();
  const fingerprint = getRateLimitFingerprint("203.0.113.11", "browser");
  const namespace = `expiry-${Date.now()}`;

  assert.equal((await checkRateLimit(namespace, fingerprint, {
    endpointLimit: 1,
    globalLimit: 100,
    windowMs: 50,
  })).allowed, true);
  assert.equal((await checkRateLimit(namespace, fingerprint, {
    endpointLimit: 1,
    globalLimit: 100,
    windowMs: 50,
  })).allowed, false);

  await new Promise((resolve) => setTimeout(resolve, 60));
  cleanupRateLimitStoreForTests();
  assert.equal(getRateLimitStoreSize(), 0);
  assert.equal((await checkRateLimit(namespace, fingerprint, {
    endpointLimit: 1,
    globalLimit: 100,
    windowMs: 50,
  })).allowed, true);
});

test("the in-memory store remains bounded under many unique fingerprints", async () => {
  resetRateLimitStoreForTests();
  const namespace = `capacity-${Date.now()}`;

  for (let index = 0; index < 2_501; index += 1) {
    await checkRateLimit(namespace, `fingerprint-${index}`, {
      endpointLimit: 10_000,
      globalLimit: 10_000,
    });
  }

  assert.ok(getRateLimitStoreSize() <= 5_000);
});
