import { NextResponse } from "next/server";

const maxBodySizeBytes = 32 * 1024;
const rateLimitWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 8;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type ProtectedJsonResult<T> =
  | {
      body: T;
      error: null;
    }
  | {
      body: null;
      error: NextResponse;
    };

type ProtectedFormDataResult =
  | {
      formData: FormData;
      error: null;
    }
  | {
      formData: null;
      error: NextResponse;
    };

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(req: Request) {
  const cloudflareIp = req.headers.get("cf-connecting-ip")?.trim();

  return cloudflareIp || "unknown";
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

function getBodySize(req: Request) {
  const contentLength = req.headers.get("content-length");

  if (!contentLength) {
    return null;
  }

  const size = Number(contentLength);
  return Number.isFinite(size) ? size : null;
}

function createJsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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
  const data = (await response.json().catch(() => null)) as { success?: boolean } | null;

  return data?.success === true;
}

async function runProtectionChecks(
  req: Request,
  allowedContentTypes: string[],
  turnstileToken: unknown
) {
  const skipTurnstile = isLocalDevelopmentRequest(req);
  const ip = getClientIp(req);

  if (!checkRateLimit(ip)) {
    return {
      error: createJsonError("Zbyt wiele zg\u0142osze\u0144. Spr\u00f3buj ponownie za kilka minut.", 429),
      ip,
      skipTurnstile,
    };
  }

  const contentType = req.headers.get("content-type") ?? "";

  if (!allowedContentTypes.some((value) => contentType.includes(value))) {
    return {
      error: createJsonError("Nieprawid\u0142owy typ zg\u0142oszenia.", 415),
      ip,
      skipTurnstile,
    };
  }

  const declaredSize = getBodySize(req);

  if (declaredSize !== null && declaredSize > maxBodySizeBytes) {
    return {
      error: createJsonError("Zg\u0142oszenie jest zbyt du\u017ce.", 413),
      ip,
      skipTurnstile,
    };
  }

  if (!skipTurnstile) {
    const isHuman = await verifyTurnstile(turnstileToken, ip);

    if (!isHuman) {
      return {
        error: createJsonError(
          "Potwierd\u017a, \u017ce formularz nie zosta\u0142 wys\u0142any automatycznie.",
          403
        ),
        ip,
        skipTurnstile,
      };
    }
  }

  return {
    error: null,
    ip,
    skipTurnstile,
  };
}

function getFormDataSize(formData: FormData) {
  let totalSize = 0;

  for (const value of formData.values()) {
    if (typeof value === "string") {
      totalSize += new TextEncoder().encode(value).length;
      continue;
    }

    totalSize += value.size;
  }

  return totalSize;
}

export async function readProtectedJson<T extends object>(
  req: Request
): Promise<ProtectedJsonResult<T>> {
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {
      body: null,
      error: createJsonError("Nieprawid\u0142owy typ zg\u0142oszenia.", 415),
    };
  }

  const rawBody = await req.text();

  if (new TextEncoder().encode(rawBody).length > maxBodySizeBytes) {
    return {
      body: null,
      error: createJsonError("Zg\u0142oszenie jest zbyt du\u017ce.", 413),
    };
  }

  let body: T;

  try {
    body = JSON.parse(rawBody) as T;
  } catch {
    return {
      body: null,
      error: createJsonError("Nieprawid\u0142owe dane formularza.", 400),
    };
  }

  const protectedBody = body as T & { turnstileToken?: unknown };
  const protection = await runProtectionChecks(req, ["application/json"], protectedBody.turnstileToken);

  if (protection.error) {
    return {
      body: null,
      error: protection.error,
    };
  }

  delete protectedBody.turnstileToken;

  return {
    body,
    error: null,
  };
}

export async function readProtectedFormData(req: Request): Promise<ProtectedFormDataResult> {
  const contentType = req.headers.get("content-type") ?? "";

  if (
    !contentType.includes("application/x-www-form-urlencoded") &&
    !contentType.includes("multipart/form-data")
  ) {
    return {
      formData: null,
      error: createJsonError("Nieprawid\u0142owy typ zg\u0142oszenia.", 415),
    };
  }

  const formData = await req.formData();

  if (getFormDataSize(formData) > maxBodySizeBytes) {
    return {
      formData: null,
      error: createJsonError("Zg\u0142oszenie jest zbyt du\u017ce.", 413),
    };
  }

  const protection = await runProtectionChecks(
    req,
    ["application/x-www-form-urlencoded", "multipart/form-data"],
    formData.get("turnstileToken")
  );

  if (protection.error) {
    return {
      formData: null,
      error: protection.error,
    };
  }

  formData.delete("turnstileToken");

  return {
    formData,
    error: null,
  };
}
