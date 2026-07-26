import "server-only";

import bcrypt from "bcryptjs";

const passwordRounds = 12;

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
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");

  if (!host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
