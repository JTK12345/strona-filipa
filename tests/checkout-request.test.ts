import assert from "node:assert/strict";
import test from "node:test";
import { readCheckoutRequest } from "../app/api/checkout/checkout-request";

const validBody = {
  courseId: "f52fb0b6-6b45-45f8-a571-89c1f50a5f81",
  termsAccepted: true,
  digitalContentAccepted: true,
};

function createRequest(body: unknown, contentType = "application/json") {
  return new Request("https://example.com/api/checkout/test", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: JSON.stringify(body),
  });
}

test("accepts the exact checkout request contract", async () => {
  assert.deepEqual(
    await readCheckoutRequest(createRequest(validBody)),
    validBody,
  );
});

test("requires both checkout consents", async () => {
  assert.equal(
    await readCheckoutRequest(
      createRequest({ ...validBody, digitalContentAccepted: false }),
    ),
    null,
  );
});

test("rejects extra checkout fields and unsupported content types", async () => {
  assert.equal(
    await readCheckoutRequest(
      createRequest({ ...validBody, amountCents: 1 }),
    ),
    null,
  );
  assert.equal(
    await readCheckoutRequest(createRequest(validBody, "text/plain")),
    null,
  );
});
