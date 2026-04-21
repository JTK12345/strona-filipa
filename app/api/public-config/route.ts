import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createCsrfToken,
  getCsrfCookieName,
  getCsrfCookieOptions,
} from "@/app/api/_utils/form-security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const csrfCookieName = getCsrfCookieName();
  const csrfToken = request.cookies.get(csrfCookieName)?.value || createCsrfToken();

  const response = NextResponse.json({
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    csrfToken,
  });

  response.cookies.set(csrfCookieName, csrfToken, getCsrfCookieOptions());

  return response;
}
