import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/app/api/_utils/access-session";

export const runtime = "nodejs";

export async function POST() {
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/logowanie" },
  });
  response.cookies.set(clearSessionCookie());

  return response;
}
