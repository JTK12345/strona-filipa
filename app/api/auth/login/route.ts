import { NextResponse } from "next/server";
import {
  createAccessToken,
  createSessionCookie,
  getAdminAccessCode,
  type AccessSession,
} from "@/app/api/_utils/access-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();

  if (!email || !code || code !== getAdminAccessCode()) {
    return NextResponse.redirect(new URL("/logowanie?error=1", request.url), 303);
  }

  const session: AccessSession = {
    role: "admin",
    email,
    accessAll: true,
    createdAt: Date.now(),
  };
  const response = NextResponse.redirect(new URL("/panel", request.url), 303);
  response.cookies.set(createSessionCookie(createAccessToken(session)));

  return response;
}
