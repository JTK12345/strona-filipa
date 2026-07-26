import assert from "node:assert/strict";
import test from "node:test";
import {
  type NotificationPurchase,
  type PaymentNotificationRepository,
  PaymentNotificationError,
  processP24Notification,
} from "../app/lib/payments/notification-service";
import type { ParsedP24Notification } from "../app/lib/payments/przelewy24-notification";
import {
  createP24NotificationSign,
} from "../app/lib/payments/przelewy24-signatures";

const config = {
  merchantId: 12345,
  posId: 12345,
  crc: "test-crc",
};

const purchase: NotificationPurchase = {
  purchaseId: "purchase-id",
  userId: "user-id",
  courseId: "course-id",
  providerSessionId: "p24-session",
  providerOrderId: null,
  status: "pending",
  amountCents: 14_900,
  itemAmountCents: 14_900,
  currency: "PLN",
};

function createNotification(
  overrides: Partial<ParsedP24Notification> = {},
): ParsedP24Notification {
  const unsigned = {
    merchantId: 12345,
    posId: 12345,
    sessionId: "p24-session",
    amount: 14_900,
    originAmount: 14_900,
    currency: "PLN",
    orderId: "9223372036854775807",
    methodId: 1,
    statement: "Profil Ciala",
    ...overrides,
  };

  return {
    ...unsigned,
    sign: createP24NotificationSign(unsigned, config.crc),
    ...overrides,
  };
}

function createRepository(
  overrides: Partial<PaymentNotificationRepository> = {},
) {
  return {
    recordNotification: async () => "event-id",
    findPurchase: async () => purchase,
    markNotificationProcessed: async () => undefined,
    markNotificationError: async () => undefined,
    completePurchase: async () => "paid" as const,
    ...overrides,
  } satisfies PaymentNotificationRepository;
}

test("verifies P24 before atomically completing the purchase", async () => {
  const operations: string[] = [];
  const result = await processP24Notification(createNotification(), {
    config,
    repository: createRepository({
      recordNotification: async () => {
        operations.push("event");
        return "event-id";
      },
      findPurchase: async () => {
        operations.push("purchase");
        return purchase;
      },
      completePurchase: async () => {
        operations.push("complete");
        return "paid";
      },
    }),
    gateway: {
      verifyTransaction: async () => {
        operations.push("verify");
        return true;
      },
    },
  });

  assert.equal(result, "paid");
  assert.deepEqual(operations, ["event", "purchase", "verify", "complete"]);
});

test("handles a repeated notification without another verification", async () => {
  let verificationCalls = 0;
  let processed = false;
  const result = await processP24Notification(createNotification(), {
    config,
    repository: createRepository({
      findPurchase: async () => ({
        ...purchase,
        status: "paid",
        providerOrderId: "9223372036854775807",
      }),
      markNotificationProcessed: async () => {
        processed = true;
      },
    }),
    gateway: {
      verifyTransaction: async () => {
        verificationCalls += 1;
        return true;
      },
    },
  });

  assert.equal(result, "already_paid");
  assert.equal(verificationCalls, 0);
  assert.equal(processed, true);
});

test("rejects a validly signed notification with a different amount", async () => {
  let verificationCalls = 0;
  let eventError = "";
  const notification = createNotification({ amount: 15_000 });

  await assert.rejects(
    () =>
      processP24Notification(notification, {
        config,
        repository: createRepository({
          markNotificationError: async (_eventId, errorCode) => {
            eventError = errorCode;
          },
        }),
        gateway: {
          verifyTransaction: async () => {
            verificationCalls += 1;
            return true;
          },
        },
      }),
    (error: unknown) =>
      error instanceof PaymentNotificationError &&
      error.code === "purchase_mismatch",
  );
  assert.equal(verificationCalls, 0);
  assert.equal(eventError, "purchase_mismatch");
});

test("rejects an invalid signature before writing an event", async () => {
  let eventWritten = false;

  await assert.rejects(
    () =>
      processP24Notification(createNotification({ sign: "b".repeat(96) }), {
        config,
        repository: createRepository({
          recordNotification: async () => {
            eventWritten = true;
            return "event-id";
          },
        }),
        gateway: { verifyTransaction: async () => true },
      }),
    (error: unknown) =>
      error instanceof PaymentNotificationError &&
      error.code === "signature_mismatch",
  );
  assert.equal(eventWritten, false);
});
