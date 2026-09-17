import { NextResponse } from "next/server";
import { isSameOriginFormRequest, isValidEmail, normalizeEmail, readUrlEncodedForm } from "@/app/lib/auth";
import { createEmailVerificationTokenForEmail } from "@/app/lib/email-verification";
import { sendEmailVerificationEmail } from "@/app/lib/email";
import { getPublicAppBaseUrl, PasswordResetUrlConfigError } from "@/app/lib/password-reset-url";
import { getClientIp } from "@/app/api/_utils/ip";
import { checkRateLimit, getRateLimitFingerprint } from "@/app/api/_utils/rateLimiter";

export const runtime = "nodejs";

function redirectToVerification() {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/potwierdz-email?sent=1" },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  let baseUrl: string;
  try {
    baseUrl = getPublicAppBaseUrl(request);
  } catch (error) {
    if (error instanceof PasswordResetUrlConfigError) {
      console.error("Email verification is unavailable because APP_URL is not configured safely.");
      return new Response("Service unavailable", { status: 503 });
    }
    throw error;
  }

  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(
    "auth-email-verification-request",
    getRateLimitFingerprint(clientIp.ip, request.headers.get("user-agent") ?? "unknown"),
    { endpointLimit: 5, globalLimit: 20 },
  );
  const formData = await readUrlEncodedForm(request, ["email"]);

  if (!rateLimit.allowed || !formData) {
    return redirectToVerification();
  }

  const email = normalizeEmail(formData.get("email"));
  if (!isValidEmail(email)) {
    return redirectToVerification();
  }

  const token = await createEmailVerificationTokenForEmail(email).catch(() => null);
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

  return redirectToVerification();
}
