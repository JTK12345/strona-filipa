import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createCsrfToken,
  getCsrfCookieName,
  getCsrfCookieOptions,
} from "@/app/api/_utils/form-security";
import {
  isAllowedHost,
  isDevelopmentHost,
  isLocalHost,
} from "@/app/api/_utils/security-config";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";

  if (
    !isAllowedHost(host) &&
    !isLocalHost(host) &&
    !(process.env.NODE_ENV !== "production" && isDevelopmentHost(host))
  ) {
    return NextResponse.json({ error: "Host nie jest dozwolony." }, { status: 403 });
  }

  const csrfCookieName = getCsrfCookieName();
  const csrfToken = request.cookies.get(csrfCookieName)?.value || createCsrfToken();
  const shouldRequireTurnstile = !isLocalHost(host);

  const response = NextResponse.json({
    turnstileSiteKey: shouldRequireTurnstile
      ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""
      : "",
    csrfToken,
    requireTurnstile: shouldRequireTurnstile,
  }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });

  response.cookies.set(csrfCookieName, csrfToken, getCsrfCookieOptions());

  return response;
}
