import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  clearSessionCookie,
  deleteUserSession,
  sessionCookieName,
} from "@/app/lib/session";
import { isSameOriginFormRequest } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const token = (await cookies()).get(sessionCookieName)?.value;
  await deleteUserSession(token);

  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/logowanie" },
  });
  response.cookies.set(clearSessionCookie());

  return response;
}
