import { NextResponse } from "next/server";
import {
  isSameOriginFormRequest,
  normalizeEmail,
  readUrlEncodedForm,
  sanitizeAuthDestination,
  verifyPassword,
} from "@/app/lib/auth";
import { getClientIp } from "@/app/api/_utils/ip";
import {
  checkRateLimit,
  getRateLimitFingerprint,
} from "@/app/api/_utils/rateLimiter";
import { queryDatabase } from "@/app/lib/db";
import { createSessionCookie, createUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

type UserRow = {
  id: string;
  password_hash: string | null;
  status: string;
};

const dummyPasswordHash =
  "$2b$12$EDNuUNSVUzFqYmkslQgRLu9k8EkAPKe2j8RfYZYCxahCX5Wo.Lwri";

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(
    "auth-login",
    getRateLimitFingerprint(
      clientIp.ip,
      request.headers.get("user-agent") ?? "unknown",
    ),
    { endpointLimit: 10, globalLimit: 20 },
  );
  const formData = await readUrlEncodedForm(request, [
    "email",
    "password",
    "next",
  ]);

  if (!rateLimit.allowed || !formData) {
    const errorDestination = new URLSearchParams({
      error: rateLimit.allowed ? "credentials" : "rate",
      next: "/panel",
    });
    const headers = new Headers(rateLimit.headers);
    headers.set("Location", `/logowanie?${errorDestination.toString()}`);
    return new NextResponse(null, { status: 303, headers });
  }

  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const destination = sanitizeAuthDestination(formData.get("next"));
  const result = await queryDatabase<UserRow>(
    `SELECT id, password_hash, status
     FROM users
     WHERE lower(email) = $1
     LIMIT 1`,
    [email],
  );
  const user = result.rows[0];
  const passwordMatches = await verifyPassword(
    password,
    user?.password_hash || dummyPasswordHash,
  );

  if (!user || user.status !== "active" || !user.password_hash || !passwordMatches) {
    const errorDestination = new URLSearchParams({
      error: "credentials",
      next: destination,
    });
    const headers = new Headers(rateLimit.headers);
    headers.set("Location", `/logowanie?${errorDestination.toString()}`);
    return new NextResponse(null, {
      status: 303,
      headers,
    });
  }

  const token = await createUserSession(user.id);
  const successHeaders = new Headers(rateLimit.headers);
  successHeaders.set("Location", destination);
  const response = new NextResponse(null, {
    status: 303,
    headers: successHeaders,
  });
  response.cookies.set(createSessionCookie(token));

  return response;
}
