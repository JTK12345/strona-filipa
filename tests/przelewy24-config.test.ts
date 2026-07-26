import assert from "node:assert/strict";
import test from "node:test";
import {
  getP24Config,
  isP24Enabled,
  P24ConfigurationError,
} from "../app/lib/payments/przelewy24-config";

const validEnvironment = {
  P24_ENABLED: "true",
  P24_ENV: "sandbox",
  P24_MERCHANT_ID: "12345",
  P24_POS_ID: "12345",
  P24_API_KEY: "api-key",
  P24_CRC: "crc",
  APP_URL: "https://profil-ciala.example",
};

test("maps Sandbox configuration to the official P24 hosts", () => {
  const config = getP24Config(validEnvironment);

  assert.equal(config.environment, "sandbox");
  assert.equal(config.apiBaseUrl, "https://sandbox.przelewy24.pl/api/v1");
  assert.equal(
    config.paymentBaseUrl,
    "https://sandbox.przelewy24.pl/trnRequest",
  );
  assert.equal(config.timeoutMs, 8000);
});

test("maps production configuration to the official P24 hosts", () => {
  const config = getP24Config({
    ...validEnvironment,
    P24_ENV: "production",
  });

  assert.equal(config.apiBaseUrl, "https://secure.przelewy24.pl/api/v1");
  assert.equal(
    config.paymentBaseUrl,
    "https://secure.przelewy24.pl/trnRequest",
  );
});

test("keeps payments disabled unless explicitly enabled", () => {
  assert.equal(isP24Enabled({ P24_ENABLED: "false" }), false);
  assert.throws(
    () => getP24Config({ P24_ENABLED: "false" }),
    (error: unknown) =>
      error instanceof P24ConfigurationError && error.code === "disabled",
  );
});

test("rejects incomplete or unsafe payment configuration", () => {
  assert.throws(
    () => getP24Config({ ...validEnvironment, P24_API_KEY: "" }),
    /P24_API_KEY/,
  );
  assert.throws(
    () => getP24Config({ ...validEnvironment, P24_ENV: "other" }),
    /P24_ENV/,
  );
  assert.throws(
    () =>
      getP24Config({
        ...validEnvironment,
        P24_ENV: "production",
        APP_URL: "http://profil-ciala.example",
      }),
    /HTTPS/,
  );
});
