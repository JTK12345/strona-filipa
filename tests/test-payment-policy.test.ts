import assert from "node:assert/strict";
import test from "node:test";
import { canUseTestPayments } from "../app/lib/payments/test-payment-policy";

const enabledEnvironment = {
  TEST_PAYMENTS_ENABLED: "true",
  TEST_PAYMENT_EMAILS: "tester@example.com, second@example.com",
  P24_ENABLED: "false",
  P24_ENV: "sandbox",
};

test("allows only an explicitly listed test account", () => {
  assert.equal(
    canUseTestPayments(enabledEnvironment, "TESTER@example.com"),
    true,
  );
  assert.equal(
    canUseTestPayments(enabledEnvironment, "other@example.com"),
    false,
  );
});

test("disables test payments when P24 or production mode is enabled", () => {
  assert.equal(
    canUseTestPayments(
      { ...enabledEnvironment, P24_ENABLED: "true" },
      "tester@example.com",
    ),
    false,
  );
  assert.equal(
    canUseTestPayments(
      { ...enabledEnvironment, P24_ENV: "production" },
      "tester@example.com",
    ),
    false,
  );
});

test("keeps the test mode disabled by default", () => {
  assert.equal(
    canUseTestPayments(
      { TEST_PAYMENT_EMAILS: "tester@example.com" },
      "tester@example.com",
    ),
    false,
  );
});
