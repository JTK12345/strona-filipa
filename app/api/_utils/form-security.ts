import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const maxBodySizeBytes = 16 * 1024;
const rateLimitWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 6;
const ipHashSalt = process.env.FORM_LOG_SALT ?? "local-form-log-salt";
const csrfCookieName =
  process.env.NODE_ENV === "production" ? "__Host-csrf-token" : "csrf-token";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type ProtectedJsonResult<T> =
  | {
      body: T;
      ip: string;
      ipHash: string;
      error: null;
    }
  | {
      body: null;
      ip: string;
      ipHash: string;
      error: NextResponse;
    };

type ProtectionOptions = {
  allowedFields: string[];
  csrfField: string;
  honeypotField: string;
  turnstileField: string;
  eventType: string;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(req: Request) {
  const cloudflareIp = req.headers.get("cf-connecting-ip")?.trim();
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return cloudflareIp || forwarded || "unknown";
}

function hashIp(ip: string) {
  return createHash("sha256").update(`${ipHashSalt}:${ip}`).digest("hex").slice(0, 16);
}

function logFormEvent(eventType: string, status: "success" | "error", ipHash: string) {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      eventType,
      status,
      ipHash,
    })
  );
}

function isLocalDevelopmentRequest(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const host = req.headers.get("host") ?? "";
  const origin = req.headers.get("origin") ?? "";

  return (
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1")
  );
}

function checkRateLimit(ip: string) {
  const now = Date.now();

  if (rateLimitStore.size > 1000) {
    for (const [storedIp, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(storedIp);
      }
    }
  }

  const current = rateLimitStore.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });

    return true;
  }

  if (current.count >= maxRequestsPerWindow) {
    return false;
  }

  current.count += 1;
  return true;
}

function createJsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getBodySize(req: Request) {
  const contentLength = req.headers.get("content-length");

  if (!contentLength) {
    return null;
  }

  const size = Number(contentLength);
  return Number.isFinite(size) ? size : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function getCookieValue(req: Request, name: string) {
  const rawCookie = req.headers.get("cookie");

  if (!rawCookie) {
    return "";
  }

  const parts = rawCookie.split(";").map((part) => part.trim());

  for (const part of parts) {
    const [cookieName, ...rest] = part.split("=");

    if (cookieName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return "";
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyCsrfToken(req: Request, token: unknown) {
  const cookieToken = getCookieValue(req, csrfCookieName);

  if (typeof token !== "string" || !token || !cookieToken) {
    return false;
  }

  return safeCompare(token, cookieToken);
}

async function verifyTurnstile(token: unknown, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return false;
  }

  if (typeof token !== "string" || !token.trim()) {
    return false;
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  if (ip !== "unknown") {
    formData.append("remoteip", ip);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json().catch(() => null)) as { success?: boolean } | null;
  return data?.success === true;
}

export function createCsrfToken() {
  return randomBytes(32).toString("hex");
}

export function getCsrfCookieName() {
  return csrfCookieName;
}

export function getCsrfCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function normalizeText(
  value: unknown,
  {
    maxLength,
    multiline = false,
  }: {
    maxLength: number;
    multiline?: boolean;
  }
) {
  if (typeof value !== "string") {
    return "";
  }

  const withoutControlChars = value.replace(multiline ? /[^\P{C}\n\r\t]+/gu : /[^\P{C}\t]+/gu, "");
  const normalizedWhitespace = multiline
    ? withoutControlChars
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    : withoutControlChars.replace(/\s+/g, " ").trim();

  return normalizedWhitespace.slice(0, maxLength);
}

export function normalizeEmail(value: unknown, maxLength: number) {
  return normalizeText(value, { maxLength }).toLowerCase();
}

export function normalizePhone(value: unknown, maxLength: number) {
  return normalizeText(value, { maxLength }).replace(/\s+/g, " ");
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value: string) {
  return /^[+]?[0-9()\s-]{6,20}$/.test(value);
}

export function hasHeaderInjection(value: string) {
  return /[\r\n]/.test(value);
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function readProtectedJson<T extends Record<string, unknown>>(
  req: Request,
  options: ProtectionOptions
): Promise<ProtectedJsonResult<T>> {
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    logFormEvent(options.eventType, "error", ipHash);

    return {
      body: null,
      ip,
      ipHash,
      error: createJsonError("Nieprawidlowy typ zgloszenia.", 415),
    };
  }

  const declaredSize = getBodySize(req);

  if (declaredSize !== null && declaredSize > maxBodySizeBytes) {
    logFormEvent(options.eventType, "error", ipHash);

    return {
      body: null,
      ip,
      ipHash,
      error: createJsonError("Zgloszenie jest zbyt duze.", 413),
    };
  }

  const rawBody = await req.text();

  if (new TextEncoder().encode(rawBody).length > maxBodySizeBytes) {
    logFormEvent(options.eventType, "error", ipHash);

    return {
      body: null,
      ip,
      ipHash,
      error: createJsonError("Zgloszenie jest zbyt duze.", 413),
    };
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    logFormEvent(options.eventType, "error", ipHash);

    return {
      body: null,
      ip,
      ipHash,
      error: createJsonError("Nieprawidlowe dane formularza.", 400),
    };
  }

  if (!isPlainObject(body)) {
    logFormEvent(options.eventType, "error", ipHash);

    return {
      body: null,
      ip,
      ipHash,
      error: createJsonError("Nieprawidlowe dane formularza.", 400),
    };
  }

  const bodyKeys = Object.keys(body);
  const unknownFields = bodyKeys.filter((key) => !options.allowedFields.includes(key));

  if (unknownFields.length > 0) {
    logFormEvent(options.eventType, "error", ipHash);

    return {
      body: null,
      ip,
      ipHash,
      error: createJsonError("Formularz zawiera nieobslugiwane pola.", 400),
    };
  }

  if (!checkRateLimit(ip)) {
    logFormEvent(options.eventType, "error", ipHash);

    return {
      body: null,
      ip,
      ipHash,
      error: createJsonError("Zbyt wiele zgloszen. Sprobuj ponownie za kilka minut.", 429),
    };
  }

  if (!verifyCsrfToken(req, body[options.csrfField])) {
    logFormEvent(options.eventType, "error", ipHash);

    return {
      body: null,
      ip,
      ipHash,
      error: createJsonError("Sesja formularza wygasla. Odswiez strone i sprobuj ponownie.", 403),
    };
  }

  const honeypotValue = body[options.honeypotField];

  if (typeof honeypotValue === "string" && honeypotValue.trim()) {
    logFormEvent(options.eventType, "error", ipHash);

    return {
      body: null,
      ip,
      ipHash,
      error: NextResponse.json({ ok: true }, { status: 200 }),
    };
  }

  if (!isLocalDevelopmentRequest(req)) {
    const isHuman = await verifyTurnstile(body[options.turnstileField], ip);

    if (!isHuman) {
      logFormEvent(options.eventType, "error", ipHash);

      return {
        body: null,
        ip,
        ipHash,
        error: createJsonError(
          "Potwierdz, ze formularz nie zostal wyslany automatycznie.",
          403
        ),
      };
    }
  }

  return {
    body: body as T,
    ip,
    ipHash,
    error: null,
  };
}

export function logFormSuccess(eventType: string, ipHash: string) {
  logFormEvent(eventType, "success", ipHash);
}
