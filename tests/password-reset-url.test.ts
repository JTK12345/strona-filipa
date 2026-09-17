import assert from "node:assert/strict";
import test from "node:test";
import {
  getPasswordResetBaseUrl,
  PasswordResetUrlConfigError,
} from "../app/lib/password-reset-url";

const request = new Request("http://localhost:3000/api/auth/password-reset/request", {
  headers: {
    host: "attacker.example",
    "x-forwarded-host": "attacker.example",
    "x-forwarded-proto": "https",
  },
});

test("uses a configured HTTPS APP_URL from allowed origins", () => {
  assert.equal(
    getPasswordResetBaseUrl(request, {
      appUrl: "https://app.example/",
      isProduction: true,
      allowedOrigins: ["https://app.example"],
    }),
    "https://app.example",
  );
});

test("requires APP_URL in production", () => {
  assert.throws(
    () => getPasswordResetBaseUrl(request, { isProduction: true, allowedOrigins: [] }),
    PasswordResetUrlConfigError,
  );
});

test("rejects invalid, HTTP, and disallowed APP_URL values in production", () => {
  for (const appUrl of ["not a url", "http://app.example", "https://other.example"]) {
    assert.throws(
      () =>
        getPasswordResetBaseUrl(request, {
          appUrl,
          isProduction: true,
          allowedOrigins: ["https://app.example"],
        }),
      PasswordResetUrlConfigError,
    );
  }
});

test("ignores spoofed forwarded headers and uses only local development fallback", () => {
  assert.equal(
    getPasswordResetBaseUrl(request, {
      isProduction: false,
      allowedOrigins: ["http://localhost:3000"],
    }),
    "http://localhost:3000",
  );
});
