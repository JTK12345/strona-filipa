import { createHmac, timingSafeEqual } from "node:crypto";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export type AccessRole = "admin" | "customer";

export type AccessSession = {
  role: AccessRole;
  email: string;
  accessAll: boolean;
  createdAt: number;
};

export const accessCookieName = "spc_access";

const defaultAdminCode = "admin-test-access";

function getSessionSecret() {
  return process.env.ACCESS_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "local-access-session-secret";
}

export function getAdminAccessCode() {
  return process.env.ADMIN_ACCESS_CODE || defaultAdminCode;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAccessToken(session: AccessSession) {
  const payload = toBase64Url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function parseAccessToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature || !safeEqual(sign(payload), signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as Partial<AccessSession>;

    if (
      (parsed.role !== "admin" && parsed.role !== "customer") ||
      typeof parsed.email !== "string" ||
      typeof parsed.accessAll !== "boolean" ||
      typeof parsed.createdAt !== "number"
    ) {
      return null;
    }

    return parsed as AccessSession;
  } catch {
    return null;
  }
}

export function createSessionCookie(value: string): ResponseCookie {
  return {
    name: accessCookieName,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function clearSessionCookie(): ResponseCookie {
  return {
    name: accessCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
