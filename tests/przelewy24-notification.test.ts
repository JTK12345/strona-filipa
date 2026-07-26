import assert from "node:assert/strict";
import test from "node:test";
import { LosslessNumber, stringify } from "lossless-json";
import {
  parseP24Notification,
} from "../app/lib/payments/przelewy24-notification";

function notificationJson(orderId: string) {
  return stringify({
    merchantId: 12345,
    posId: 12345,
    sessionId: "p24-session",
    amount: 14_900,
    originAmount: 14_900,
    currency: "PLN",
    orderId: new LosslessNumber(orderId),
    methodId: 1,
    statement: "Profil Ciala",
    sign: "a".repeat(96),
  });
}

test("preserves the full P24 int64 orderId", () => {
  const rawBody = notificationJson("9223372036854775807");

  assert.ok(rawBody);
  assert.equal(
    parseP24Notification(rawBody).orderId,
    "9223372036854775807",
  );
});

test("rejects duplicate keys and invalid numeric values", () => {
  assert.throws(
    () =>
      parseP24Notification(
        '{"merchantId":1,"merchantId":2,"sign":"' +
          "a".repeat(96) +
          '"}',
      ),
    /Invalid/,
  );
  assert.throws(
    () => parseP24Notification(notificationJson("-1") ?? ""),
    /orderId/,
  );
});
