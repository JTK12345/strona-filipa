import assert from "node:assert/strict";
import test from "node:test";
import {
  CheckoutError,
  createCourseCheckout,
  type CheckoutRepository,
  type PendingCoursePurchase,
} from "../app/lib/payments/checkout-service";

const courseId = "f52fb0b6-6b45-45f8-a571-89c1f50a5f81";
const purchase: PendingCoursePurchase = {
  purchaseId: "purchase-id",
  publicOrderNumber: "PC-TEST",
  providerSessionId: "p24-session",
  buyerEmail: "user@example.com",
  courseId,
  courseTitle: "Kurs testowy",
  amountCents: 14_900,
  currency: "PLN",
};

function createRepository(overrides: Partial<CheckoutRepository> = {}) {
  return {
    createPendingPurchase: async () => purchase,
    markPurchaseRegistered: async () => undefined,
    markPurchaseRegistrationFailed: async () => undefined,
    ...overrides,
  } satisfies CheckoutRepository;
}

function checkoutInput() {
  return {
    userId: "user-id",
    email: "user@example.com",
    role: "user" as const,
    courseId,
    appUrl: "https://profil-ciala.example",
  };
}

test("creates pending purchase before registering the P24 transaction", async () => {
  const operations: string[] = [];
  let registrationAmount = 0;
  const repository = createRepository({
    createPendingPurchase: async () => {
      operations.push("pending");
      return purchase;
    },
    markPurchaseRegistered: async (_purchaseId, token) => {
      operations.push(`registered:${token}`);
    },
  });

  const result = await createCourseCheckout(checkoutInput(), {
    repository,
    gateway: {
      registerTransaction: async (input) => {
        operations.push("provider");
        registrationAmount = input.amount;
        return { token: "payment-token" };
      },
      getPaymentUrl: (token) => `https://sandbox.example/${token}`,
    },
    createIdentifiers: () => ({
      providerSessionId: "p24-session",
      publicOrderNumber: "PC-TEST",
    }),
  });

  assert.deepEqual(operations, [
    "pending",
    "provider",
    "registered:payment-token",
  ]);
  assert.equal(registrationAmount, 14_900);
  assert.equal(result.redirectUrl, "https://sandbox.example/payment-token");
});

test("marks the pending purchase as failed when P24 registration fails", async () => {
  let failureReason = "";
  const repository = createRepository({
    markPurchaseRegistrationFailed: async (_purchaseId, reason) => {
      failureReason = reason;
    },
  });

  await assert.rejects(
    () =>
      createCourseCheckout(checkoutInput(), {
        repository,
        gateway: {
          registerTransaction: async () => {
            throw new Error("provider details must stay private");
          },
          getPaymentUrl: () => "",
        },
        createIdentifiers: () => ({
          providerSessionId: "p24-session",
          publicOrderNumber: "PC-TEST",
        }),
      }),
    (error: unknown) =>
      error instanceof CheckoutError &&
      error.code === "provider_unavailable" &&
      !error.message.includes("provider details"),
  );
  assert.equal(failureReason, "Error");
});

test("blocks administrators before creating a payment", async () => {
  let pendingCreated = false;

  await assert.rejects(
    () =>
      createCourseCheckout(
        { ...checkoutInput(), role: "admin" },
        {
          repository: createRepository({
            createPendingPurchase: async () => {
              pendingCreated = true;
              return purchase;
            },
          }),
          gateway: {
            registerTransaction: async () => ({ token: "unused" }),
            getPaymentUrl: () => "",
          },
          createIdentifiers: () => ({
            providerSessionId: "unused",
            publicOrderNumber: "unused",
          }),
        },
      ),
    (error: unknown) =>
      error instanceof CheckoutError && error.code === "already_owned",
  );
  assert.equal(pendingCreated, false);
});

test("accepts only a UUID course identifier", async () => {
  await assert.rejects(
    () =>
      createCourseCheckout(
        { ...checkoutInput(), courseId: "first-course" },
        {
          repository: createRepository(),
          gateway: {
            registerTransaction: async () => ({ token: "unused" }),
            getPaymentUrl: () => "",
          },
          createIdentifiers: () => ({
            providerSessionId: "unused",
            publicOrderNumber: "unused",
          }),
        },
      ),
    (error: unknown) =>
      error instanceof CheckoutError && error.code === "invalid_course",
  );
});
