import { isLosslessNumber, parse as parseLosslessJson } from "lossless-json";
import type { P24Notification } from "./przelewy24-signatures";

export type ParsedP24Notification = P24Notification & {
  sign: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(
  record: Record<string, unknown>,
  field: string,
  maxLength: number,
) {
  const value = record[field];

  if (typeof value !== "string" || !value || value.length > maxLength) {
    throw new TypeError(`Invalid P24 notification field: ${field}.`);
  }

  return value;
}

function readIntegerText(record: Record<string, unknown>, field: string) {
  const value = record[field];

  if (!isLosslessNumber(value)) {
    throw new TypeError(`Invalid P24 notification field: ${field}.`);
  }

  const text = value.toString();

  if (!/^(0|[1-9]\d*)$/.test(text)) {
    throw new TypeError(`Invalid P24 notification field: ${field}.`);
  }

  return text;
}

function readSafeInteger(record: Record<string, unknown>, field: string) {
  const text = readIntegerText(record, field);
  const value = Number(text);

  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`P24 notification field is too large: ${field}.`);
  }

  return value;
}

export function parseP24Notification(rawBody: string): ParsedP24Notification {
  let parsed: unknown;

  try {
    parsed = parseLosslessJson(rawBody);
  } catch {
    throw new TypeError("Invalid P24 notification JSON.");
  }

  if (!isRecord(parsed)) {
    throw new TypeError("Invalid P24 notification payload.");
  }

  const orderId = readIntegerText(parsed, "orderId");

  if (BigInt(orderId) > BigInt("9223372036854775807")) {
    throw new TypeError("P24 orderId is outside the int64 range.");
  }

  const currency = readText(parsed, "currency", 3);
  const sign = readText(parsed, "sign", 96);

  if (!/^[a-f0-9]{96}$/i.test(sign)) {
    throw new TypeError("Invalid P24 notification signature format.");
  }

  return {
    merchantId: readSafeInteger(parsed, "merchantId"),
    posId: readSafeInteger(parsed, "posId"),
    sessionId: readText(parsed, "sessionId", 100),
    amount: readSafeInteger(parsed, "amount"),
    originAmount: readSafeInteger(parsed, "originAmount"),
    currency,
    orderId,
    methodId: readSafeInteger(parsed, "methodId"),
    statement: readText(parsed, "statement", 1024),
    sign,
  };
}

export function getP24NotificationEventId(
  notification: ParsedP24Notification,
) {
  return `${notification.sessionId}:${notification.orderId}`;
}

export function getP24NotificationPayload(
  notification: ParsedP24Notification,
) {
  return {
    merchantId: notification.merchantId,
    posId: notification.posId,
    sessionId: notification.sessionId,
    amount: notification.amount,
    originAmount: notification.originAmount,
    currency: notification.currency,
    orderId: notification.orderId,
    methodId: notification.methodId,
    statement: notification.statement,
    sign: notification.sign,
  };
}
