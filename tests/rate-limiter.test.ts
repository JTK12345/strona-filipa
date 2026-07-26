import assert from "node:assert/strict";
import test from "node:test";
import {
  checkRateLimit,
  getRateLimitFingerprint,
} from "../app/api/_utils/rateLimiter";

test("rate limits a stable IP even when the user agent changes", async () => {
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
