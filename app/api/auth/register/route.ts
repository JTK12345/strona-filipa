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
import { createEmailVerificationToken } from "@/app/lib/email-verification";
import { sendEmailVerificationEmail } from "@/app/lib/email";
import {
  getPublicAppBaseUrl,
  PasswordResetUrlConfigError,
} from "@/app/lib/password-reset-url";

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

function verificationRedirect(destination: string) {
  const searchParams = new URLSearchParams({ sent: "1", next: destination });
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/potwierdz-email?${searchParams.toString()}` },
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
  let baseUrl: string;

  try {
    baseUrl = getPublicAppBaseUrl(request);
  } catch (error) {
    if (error instanceof PasswordResetUrlConfigError) {
      console.error("Registration is unavailable because APP_URL is not configured safely.");
      return registrationRedirect("server", destination);
    }
    throw error;
  }

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
      return verificationRedirect(destination);
    }

    const token = await createEmailVerificationToken(result.rows[0].id);

    if (token) {
      const verificationUrl = new URL("/potwierdz-email", baseUrl);
      verificationUrl.searchParams.set("token", token);
      await sendEmailVerificationEmail({
        to: email,
        verificationUrl: verificationUrl.toString(),
      }).catch(() => {
        console.error("Email verification email failed.");
      });
    }

    return verificationRedirect(destination);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return verificationRedirect(destination);
    }

    return registrationRedirect("server", destination);
  }
}
