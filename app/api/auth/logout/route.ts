import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/app/api/_utils/access-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/logowanie", request.url), 303);
  response.cookies.set(clearSessionCookie());

  return response;
}
