import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getClientIp } from "@/app/api/_utils/ip";
import { checkRateLimit, getRateLimitFingerprint } from "@/app/api/_utils/rateLimiter";
import {
  isAllowedHost,
  isLocalHost,
  isAllowedOrigin,
  isDevelopmentHost,
  securityConfig,
} from "@/app/api/_utils/security-config";

const csrfCookieName =
  process.env.NODE_ENV === "production" ? "__Host-csrf-token" : "csrf-token";
const HTML_TAG_PATTERN = /<[^>]+>/;

type ProtectedBody = Record<string, unknown>;

type GuardOptions = {
  allowedFields: string[];
  csrfField: string;
  honeypotField: string;
  turnstileField: string;
  eventType: string;
  endpointKey: string;
  requireOrigin?: boolean;
};

type ProtectedRequestResult<T extends ProtectedBody> =
  | {
      body: T;
      ip: string;
      ipHash: string;
      error: null;
      rateLimitHeaders: Headers;
    }
  | {
      body: null;
      ip: string;
      ipHash: string;
      error: NextResponse;
      rateLimitHeaders: Headers;
    };

function createJsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

function hashIp(ip: string) {
  return createHash("sha256").update(`${securityConfig.logSalt}:${ip}`).digest("hex");
}

function logSecurityEvent(eventType: string, status: "success" | "error", ipHash: string) {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      eventType,
      status,
      ipHash,
    })
  );
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
  return typeof token === "string" && Boolean(token) && Boolean(cookieToken) && safeCompare(token, cookieToken);
}

function getBodySize(req: Request) {
  const contentLength = req.headers.get("content-length");
  if (!contentLength) {
    return null;
  }

  const size = Number(contentLength);
  return Number.isFinite(size) ? size : null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    timeout.unref?.();

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

async function parseBody(req: Request) {
  const rawBody = await withTimeout(req.text(), securityConfig.requestTimeoutMs, "request_timeout");
  const rawBodyBytes = new TextEncoder().encode(rawBody).length;

  if (rawBodyBytes > securityConfig.bodyLimitBytes) {
    throw new Error("body_too_large");
  }

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody) as unknown;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawBody)) as unknown;
  }

  throw new Error("unsupported_content_type");
}

function validateOriginAndHost(request: Request, requireOrigin: boolean) {
  const origin = request.headers.get("origin")?.trim() ?? "";
  const host = request.headers.get("host")?.trim().toLowerCase() ?? "";
  const requestHost = new URL(request.url).host.toLowerCase();

  if (!host || host !== requestHost) {
    return "Nieprawidlowy naglowek Host.";
  }

  if (!isAllowedHost(host) && !(process.env.NODE_ENV !== "production" && isDevelopmentHost(host))) {
    return "Zrodlo zapytania nie jest dozwolone.";
  }

  if (!origin) {
    if (requireOrigin) {
      return "Brak wymaganego naglowka Origin.";
    }

    return null;
  }

  if (!isAllowedOrigin(origin)) {
    return "Origin nie jest dozwolony.";
  }

  return null;
}

function isLocalTestRequest(request: Request) {
  const host = request.headers.get("host")?.trim().toLowerCase() ?? "";
  const origin = request.headers.get("origin")?.trim() ?? "";

  if (isLocalHost(host)) {
    return true;
  }

  if (!origin) {
    return false;
  }

  try {
    return isLocalHost(new URL(origin).host);
  } catch {
    return false;
  }
}

async function verifyTurnstile(token: unknown, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
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
    signal: AbortSignal.timeout(securityConfig.verificationTimeoutMs),
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
  { maxLength, multiline = false }: { maxLength: number; multiline?: boolean }
) {
  if (typeof value !== "string") {
    return "";
  }

  const withoutTags = value.replace(HTML_TAG_PATTERN, " ");
  const withoutControlChars = withoutTags.replace(
    multiline ? /[^\P{C}\n\r\t]+/gu : /[^\P{C}\t]+/gu,
    ""
  );

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

export function sanitizeHeaderValue(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function containsHtml(value: string) {
  return HTML_TAG_PATTERN.test(value);
}

export async function readProtectedForm<T extends ProtectedBody>(
  req: Request,
  options: GuardOptions
): Promise<ProtectedRequestResult<T>> {
  const clientIp = getClientIp(req);
  const ipHash = hashIp(clientIp.ip);
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const fingerprint = getRateLimitFingerprint(clientIp.ip, userAgent);
  const rateLimit = await checkRateLimit(options.endpointKey, fingerprint);

  if (!rateLimit.allowed) {
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError(
        "Zbyt wiele zgloszen. Sprobuj ponownie za kilka minut.",
        429,
        rateLimit.headers
      ),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  if (req.method !== "POST") {
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError("Metoda nie jest dozwolona.", 405, rateLimit.headers),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (
    !contentType.includes("application/json") &&
    !contentType.includes("application/x-www-form-urlencoded")
  ) {
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError("Nieprawidlowy typ zgloszenia.", 415, rateLimit.headers),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  const declaredSize = getBodySize(req);
  if (declaredSize !== null && declaredSize > securityConfig.bodyLimitBytes) {
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError("Zgloszenie jest zbyt duze.", 413, rateLimit.headers),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  const originError = validateOriginAndHost(req, options.requireOrigin ?? true);
  if (originError) {
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError(originError, 403, rateLimit.headers),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  const isLocalRequest = isLocalTestRequest(req);

  if (!isLocalRequest && clientIp.source !== "local-dev" && !clientIp.isTrustedProxy) {
    // Next.js 16 no longer exposes the direct peer IP to Route Handlers.
    // Without a network-level allowlist or trusted proxy secret, headers alone are forgeable.
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError(
        "Zapytanie nie przyszlo przez zaufane proxy. Zablokowano.",
        403,
        rateLimit.headers
      ),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  let body: unknown;

  try {
    body = await parseBody(req);
  } catch (error) {
    logSecurityEvent(options.eventType, "error", ipHash);
    const errorMessage = error instanceof Error ? error.message : "invalid_body";
    const status =
      errorMessage === "body_too_large"
        ? 413
        : errorMessage === "unsupported_content_type"
          ? 415
          : errorMessage === "request_timeout"
            ? 408
            : 400;

    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError("Nieprawidlowe dane formularza.", status, rateLimit.headers),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  if (!isPlainObject(body)) {
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError("Nieprawidlowe dane formularza.", 400, rateLimit.headers),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  const unknownFields = Object.keys(body).filter((key) => !options.allowedFields.includes(key));
  if (unknownFields.length > 0) {
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError("Formularz zawiera nieobslugiwane pola.", 400, rateLimit.headers),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  if (!verifyCsrfToken(req, body[options.csrfField])) {
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError(
        "Sesja formularza wygasla. Odswiez strone i sprobuj ponownie.",
        403,
        rateLimit.headers
      ),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  const honeypotValue = body[options.honeypotField];
  if (typeof honeypotValue === "string" && honeypotValue.trim()) {
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: NextResponse.json({ ok: true }, { status: 200, headers: rateLimit.headers }),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  if (isLocalRequest) {
    return {
      body: body as T,
      ip: clientIp.ip,
      ipHash,
      error: null,
      rateLimitHeaders: rateLimit.headers,
    };
  }

  const isHuman = await verifyTurnstile(body[options.turnstileField], clientIp.ip);
  if (!isHuman) {
    logSecurityEvent(options.eventType, "error", ipHash);
    return {
      body: null,
      ip: clientIp.ip,
      ipHash,
      error: createJsonError(
        "Potwierdz, ze formularz nie zostal wyslany automatycznie.",
        403,
        rateLimit.headers
      ),
      rateLimitHeaders: rateLimit.headers,
    };
  }

  return {
    body: body as T,
    ip: clientIp.ip,
    ipHash,
    error: null,
    rateLimitHeaders: rateLimit.headers,
  };
}

export function logFormSuccess(eventType: string, ipHash: string) {
  logSecurityEvent(eventType, "success", ipHash);
}
