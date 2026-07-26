import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isAllowedHost,
  isDevelopmentHost,
  isLocalHost,
} from "@/app/api/_utils/security-config";

function createNonce() {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

function createCspHeader(nonce: string, isDev: boolean) {
  return [
    "default-src 'self'",
    [
      "script-src",
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "https://challenges.cloudflare.com",
      isDev ? "'unsafe-eval'" : "",
    ]
      .filter(Boolean)
      .join(" "),
    ["style-src", "'self'", isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`].join(" "),
    "style-src-attr 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";

  if (
    !isAllowedHost(host) &&
    !isLocalHost(host) &&
    !(process.env.NODE_ENV !== "production" && isDevelopmentHost(host))
  ) {
    return NextResponse.json({ error: "Host nie jest dozwolony." }, { status: 403 });
  }

  if (request.nextUrl.pathname === "/formularze" || request.nextUrl.pathname.startsWith("/formularze/")) {
    const redirectUrl = new URL("/#kontakt", request.url);
    return NextResponse.redirect(redirectUrl, 301);
  }

  const nonce = createNonce();
  const isDev = process.env.NODE_ENV !== "production";
  const cspHeader = createCspHeader(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // CSP is applied to document responses here. JSON API routes are hardened in Route Handlers
  // because CSP does not materially protect machine-readable JSON payloads.
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), browsing-topics=()"
  );

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
