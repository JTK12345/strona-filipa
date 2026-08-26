import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  clearSessionCookie,
  getCurrentUserSession,
  sessionCookieName,
} from "@/app/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const hasSessionCookie = Boolean(cookieStore.get(sessionCookieName)?.value);
  const session = await getCurrentUserSession();

  const response = NextResponse.json(
    {
      authenticated: Boolean(session),
      role: session?.role ?? null,
      hasAnyAccess: session?.hasAnyAccess ?? false,
      hasLibraryAccess: session?.hasLibraryAccess ?? false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );

  if (!session && hasSessionCookie) {
    response.cookies.set(clearSessionCookie());
  }

  return response;
}
