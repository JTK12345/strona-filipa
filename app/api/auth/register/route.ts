import { NextResponse } from "next/server";
import {
  hashPassword,
  isSameOriginFormRequest,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  readUrlEncodedForm,
  sanitizeAuthDestination,
} from "@/app/lib/auth";
import { getClientIp } from "@/app/api/_utils/ip";
import {
  checkRateLimit,
  getRateLimitFingerprint,
} from "@/app/api/_utils/rateLimiter";
import { queryDatabase } from "@/app/lib/db";
import { createSessionCookie, createUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

type CreatedUserRow = {
  id: string;
};

function registrationRedirect(error: string, destination: string) {
  const searchParams = new URLSearchParams({ error, next: destination });
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/rejestracja?${searchParams.toString()}` },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(
    "auth-register",
    getRateLimitFingerprint(
      clientIp.ip,
      request.headers.get("user-agent") ?? "unknown",
    ),
    { endpointLimit: 5, globalLimit: 20 },
  );
  const formData = await readUrlEncodedForm(request, [
    "email",
    "password",
    "passwordConfirmation",
    "next",
  ]);

  if (!rateLimit.allowed) {
    return registrationRedirect("rate", "/panel");
  }

  if (!formData) {
    return registrationRedirect("invalid", "/panel");
  }

  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "");
  const destination = sanitizeAuthDestination(formData.get("next"));

  if (!isValidEmail(email) || !isValidPassword(password)) {
    return registrationRedirect("invalid", destination);
  }

  if (password !== passwordConfirmation) {
    return registrationRedirect("mismatch", destination);
  }

  const passwordHash = await hashPassword(password);

  try {
    const result = await queryDatabase<CreatedUserRow>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (lower(email))
       DO NOTHING
       RETURNING id`,
      [email, passwordHash],
    );

    if (!result.rows[0]) {
      return registrationRedirect("exists", destination);
    }

    const token = await createUserSession(result.rows[0].id);
    const response = new NextResponse(null, {
      status: 303,
      headers: { Location: destination },
    });
    response.cookies.set(createSessionCookie(token));
    return response;
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return registrationRedirect("exists", destination);
    }

    return registrationRedirect("server", destination);
  }
}
