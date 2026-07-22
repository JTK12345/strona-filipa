import { NextResponse } from "next/server";
import {
  createAccessToken,
  createSessionCookie,
  type AccessSession,
} from "@/app/api/_utils/access-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/kup?error=1" },
    });
  }

  const session: AccessSession = {
    role: "customer",
    email,
    accessAll: true,
    createdAt: Date.now(),
  };
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/panel?purchase=success" },
  });
  response.cookies.set(createSessionCookie(createAccessToken(session)));

  return response;
}
