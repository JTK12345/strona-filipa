import assert from "node:assert/strict";
import test from "node:test";
import {
  createP24NotificationSign,
  createP24RegistrationSign,
  createP24VerificationSign,
  p24SignaturesMatch,
} from "../app/lib/payments/przelewy24-signatures";

test("creates the registration sign in the field order required by P24", () => {
  const sign = createP24RegistrationSign(
    {
      sessionId: "sessionId",
      merchantId: 999999,
      amount: 1000,
      currency: "PLN",
    },
    "crc",
  );

  assert.equal(
    sign,
    "a34cf822f00b51d8d75e2d21334d6ffb5f2fac8408574f4cd7d4897f07ed61312244f9875e18ce63a4fbe2668d7ffc30",
  );
});

test("creates the verification sign with the P24 orderId", () => {
  const sign = createP24VerificationSign(
    {
      sessionId: "sessionId",
      orderId: 999999,
      amount: 1000,
      currency: "PLN",
    },
    "crc",
  );

  assert.equal(
    sign,
    "3edcfa853ade37780fdcd00541b2c266117a7d35fab662ddc26498495c09b048e736f28424b616d2f1fbd882f6a47f0c",
  );
});

test("creates and compares the notification sign", () => {
  const sign = createP24NotificationSign(
    {
      merchantId: 999999,
      posId: 999999,
      sessionId: "sessionId",
      amount: 1000,
      originAmount: 1000,
      currency: "PLN",
      orderId: 999999,
      methodId: 1,
      statement: "Profil Ciala",
    },
    "crc",
  );
  const expected =
    "6e89ec5cb678ac49cedbddf4ea9217bb0903934f2db594791951aedf7390cff91dfe7f7938f135d8cb9308367c706ba1";

  assert.equal(sign, expected);
  assert.equal(p24SignaturesMatch(sign, expected.toUpperCase()), true);
  assert.equal(p24SignaturesMatch(sign, "invalid"), false);
});

test("rejects unsafe numeric values before signing", () => {
  assert.throws(
    () =>
      createP24VerificationSign(
        {
          sessionId: "sessionId",
          orderId: Number.MAX_SAFE_INTEGER + 1,
          amount: 1000,
          currency: "PLN",
        },
        "crc",
      ),
    /orderId/,
  );
});
