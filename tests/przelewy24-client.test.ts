import assert from "node:assert/strict";
import test from "node:test";
import { Przelewy24Client, P24ApiError } from "../app/lib/payments/przelewy24-client";
import type { P24Config } from "../app/lib/payments/przelewy24-config";

const config: P24Config = {
  environment: "sandbox",
  merchantId: 12345,
  posId: 12345,
  apiKey: "secret-api-key",
  crc: "secret-crc",
  appUrl: "https://profil-ciala.example",
  apiBaseUrl: "https://sandbox.przelewy24.pl/api/v1",
  paymentBaseUrl: "https://sandbox.przelewy24.pl/trnRequest",
  timeoutMs: 1000,
};

test("uses Basic Auth and confirms testAccess", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  const fetchMock: typeof fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(JSON.stringify({ data: true }), { status: 200 });
  };

  const client = new Przelewy24Client(config, fetchMock);

  assert.equal(await client.testAccess(), true);
  assert.equal(
    capturedUrl,
    "https://sandbox.przelewy24.pl/api/v1/testAccess",
  );
  assert.equal(
    new Headers(capturedInit?.headers).get("Authorization"),
    `Basic ${Buffer.from("12345:secret-api-key").toString("base64")}`,
  );
});

test("registers a transaction using backend-owned merchant data", async () => {
  let requestBody: Record<string, unknown> = {};
  const fetchMock: typeof fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({ data: { token: "sandbox-token" }, responseCode: 0 }),
      { status: 200 },
    );
  };
  const client = new Przelewy24Client(config, fetchMock);

  const result = await client.registerTransaction({
    sessionId: "purchase-session",
    amount: 14_900,
    currency: "PLN",
    description: "Kurs testowy",
    email: "user@example.com",
    urlReturn: "https://profil-ciala.example/platnosc/sukces",
    urlStatus: "https://profil-ciala.example/api/payments/przelewy24/status",
  });

  assert.deepEqual(result, { token: "sandbox-token" });
  assert.equal(requestBody.merchantId, 12345);
  assert.equal(requestBody.amount, 14_900);
  assert.equal(requestBody.regulationAccept, false);
  assert.match(String(requestBody.sign), /^[a-f0-9]{96}$/);
  assert.equal(
    client.getPaymentUrl(result.token),
    "https://sandbox.przelewy24.pl/trnRequest/sandbox-token",
  );
});

test("verifies a transaction using the P24 order identifier", async () => {
  let requestBody: Record<string, unknown> = {};
  const fetchMock: typeof fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({ data: { status: "success" }, responseCode: 0 }),
      { status: 200 },
    );
  };
  const client = new Przelewy24Client(config, fetchMock);

  assert.equal(
    await client.verifyTransaction({
      sessionId: "purchase-session",
      amount: 14_900,
      currency: "PLN",
      orderId: "987654",
    }),
    true,
  );
  assert.equal(requestBody.orderId, 987654);
  assert.match(String(requestBody.sign), /^[a-f0-9]{96}$/);
});

test("does not expose provider response bodies in controlled errors", async () => {
  const fetchMock: typeof fetch = async () =>
    new Response('{"error":"provider-secret-detail"}', { status: 401 });
  const client = new Przelewy24Client(config, fetchMock);

  await assert.rejects(
    () => client.testAccess(),
    (error: unknown) =>
      error instanceof P24ApiError &&
      error.code === "provider" &&
      error.status === 401 &&
      !error.message.includes("provider-secret-detail"),
  );
});

test("rejects malformed successful responses", async () => {
  const fetchMock: typeof fetch = async () =>
    new Response("not-json", { status: 200 });
  const client = new Przelewy24Client(config, fetchMock);

  await assert.rejects(
    () => client.testAccess(),
    (error: unknown) =>
      error instanceof P24ApiError && error.code === "invalid_response",
  );
});
