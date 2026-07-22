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
  const requestedNext = String(formData.get("next") ?? "");
  const destination =
    requestedNext === "/biblioteka" || requestedNext === "/panel"
      ? requestedNext
      : "/panel";

  if (!email || !code || code !== getAdminAccessCode()) {
    const errorDestination = new URLSearchParams({ error: "1", next: destination });
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `/logowanie?${errorDestination.toString()}` },
    });
  }

  const session: AccessSession = {
    role: "admin",
    email,
    accessAll: true,
    createdAt: Date.now(),
  };
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: destination },
  });
  response.cookies.set(createSessionCookie(createAccessToken(session)));

  return response;
}
