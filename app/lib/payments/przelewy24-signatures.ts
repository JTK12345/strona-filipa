import { createHash, timingSafeEqual } from "node:crypto";
import { LosslessNumber, stringify as losslessStringify } from "lossless-json";

type RegistrationSignatureInput = {
  sessionId: string;
  merchantId: number;
  amount: number;
  currency: string;
};

type VerificationSignatureInput = {
  sessionId: string;
  orderId: string;
  amount: number;
  currency: string;
};

export type P24Notification = {
  merchantId: number;
  posId: number;
  sessionId: string;
  amount: number;
  originAmount: number;
  currency: string;
  orderId: string;
  methodId: number;
  statement: string;
};

function sha384(value: unknown) {
  const serialized = losslessStringify(value);

  if (!serialized) {
    throw new TypeError("The P24 signature payload could not be serialized.");
  }

  return createHash("sha384").update(serialized, "utf8").digest("hex");
}

function assertSafeInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative safe integer.`);
  }
}

function assertText(value: string, field: string) {
  if (!value) {
    throw new TypeError(`${field} must not be empty.`);
  }
}

function asInt64(value: string, field: string) {
  if (
    !/^(0|[1-9]\d*)$/.test(value) ||
    BigInt(value) > BigInt("9223372036854775807")
  ) {
    throw new TypeError(`${field} must be an unsigned 64-bit integer.`);
  }

  return new LosslessNumber(value);
}

function validateCommonInput(input: {
  sessionId: string;
  amount: number;
  currency: string;
}) {
  assertText(input.sessionId, "sessionId");
  assertSafeInteger(input.amount, "amount");
  assertText(input.currency, "currency");
}

export function createP24RegistrationSign(
  input: RegistrationSignatureInput,
  crc: string,
) {
  validateCommonInput(input);
  assertSafeInteger(input.merchantId, "merchantId");
  assertText(crc, "crc");

  return sha384({
    sessionId: input.sessionId,
    merchantId: input.merchantId,
    amount: input.amount,
    currency: input.currency,
    crc,
  });
}

export function createP24VerificationSign(
  input: VerificationSignatureInput,
  crc: string,
) {
  validateCommonInput(input);
  assertText(crc, "crc");

  return sha384({
    sessionId: input.sessionId,
    orderId: asInt64(input.orderId, "orderId"),
    amount: input.amount,
    currency: input.currency,
    crc,
  });
}

export function createP24NotificationSign(
  input: P24Notification,
  crc: string,
) {
  validateCommonInput(input);
  assertSafeInteger(input.merchantId, "merchantId");
  assertSafeInteger(input.posId, "posId");
  assertSafeInteger(input.originAmount, "originAmount");
  assertSafeInteger(input.methodId, "methodId");
  assertText(input.statement, "statement");
  assertText(crc, "crc");

  return sha384({
    merchantId: input.merchantId,
    posId: input.posId,
    sessionId: input.sessionId,
    amount: input.amount,
    originAmount: input.originAmount,
    currency: input.currency,
    orderId: asInt64(input.orderId, "orderId"),
    methodId: input.methodId,
    statement: input.statement,
    crc,
  });
}

export function p24SignaturesMatch(actual: string, expected: string) {
  if (
    !/^[a-f0-9]{96}$/i.test(actual) ||
    !/^[a-f0-9]{96}$/i.test(expected)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(actual.toLowerCase(), "hex"),
    Buffer.from(expected.toLowerCase(), "hex"),
  );
}
