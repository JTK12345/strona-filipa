import "server-only";

import bcrypt from "bcryptjs";
import {
  isAllowedHost,
  isAllowedOrigin,
  isLocalHost,
} from "@/app/api/_utils/security-config";

const passwordRounds = 12;
const maximumAuthBodySize = 4096;

export function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string) {
  return password.length >= 10 && password.length <= 128;
}

export function sanitizeAuthDestination(value: FormDataEntryValue | string | null) {
  const destination = String(value ?? "");
  return destination === "/biblioteka" || destination === "/panel" || destination === "/kup"
    ? destination
    : "/panel";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, passwordRounds);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function isSameOriginFormRequest(request: Request) {
  const origin = request.headers.get("origin")?.trim() ?? "";
  const host = request.headers.get("host")?.trim().toLowerCase() ?? "";

  if (!host || (!isAllowedHost(host) && !isLocalHost(host))) {
    return false;
  }

  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }

  if (isAllowedOrigin(origin)) {
    return true;
  }

  try {
    return isLocalHost(host) && isLocalHost(new URL(origin).host);
  } catch {
    return false;
  }
}

export async function readUrlEncodedForm(
  request: Request,
  allowedFields: readonly string[],
) {
  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? "0");

  if (
    !contentType.includes("application/x-www-form-urlencoded") ||
    (Number.isFinite(declaredLength) && declaredLength > maximumAuthBodySize)
  ) {
    return null;
  }

  const rawBody = await request.text();

  if (new TextEncoder().encode(rawBody).length > maximumAuthBodySize) {
    return null;
  }

  const form = new URLSearchParams(rawBody);
  const receivedFields = [...form.keys()];

  if (
    receivedFields.some((field) => !allowedFields.includes(field)) ||
    new Set(receivedFields).size !== receivedFields.length
  ) {
    return null;
  }

  return form;
}
