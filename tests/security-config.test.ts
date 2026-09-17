import assert from "node:assert/strict";
import test from "node:test";
import { getClientIp } from "../app/api/_utils/ip";
import { isLocalHost } from "../app/api/_utils/security-config";

test("recognizes only exact loopback hosts", () => {
  assert.equal(isLocalHost("localhost:3000"), true);
  assert.equal(isLocalHost("127.0.0.1:3010"), true);
  assert.equal(isLocalHost("[::1]:3000"), true);
  assert.equal(isLocalHost("localhost.example.com"), false);
  assert.equal(isLocalHost("127.0.0.1.example.com"), false);
});

test("ignores forwarded IP headers from an untrusted request", () => {
  const request = new Request("https://example.com/api/contact", {
    headers: {
      host: "example.com",
      "x-forwarded-for": "198.51.100.20",
      "x-real-ip": "198.51.100.21",
    },
  });

  assert.deepEqual(getClientIp(request), {
    ip: "unknown",
    isTrustedProxy: false,
    source: "unknown",
  });
});

test("accepts forwarded IP headers only with the configured proxy secret", () => {
  const request = new Request("https://example.com/api/contact", {
    headers: {
      host: "example.com",
      "x-forwarded-for": "198.51.100.20, 10.0.0.1",
      "x-real-ip": "198.51.100.21",
      "x-trusted-proxy-secret": "proxy-secret",
    },
  });

  assert.deepEqual(getClientIp(request, "proxy-secret"), {
    ip: "198.51.100.21",
    isTrustedProxy: true,
    source: "x-real-ip",
  });
  assert.deepEqual(getClientIp(request, "wrong-secret"), {
    ip: "unknown",
    isTrustedProxy: false,
    source: "unknown",
  });
});
