import { NextResponse } from "next/server";
import {
  isSameOriginFormRequest,
  isValidEmail,
  normalizeEmail,
  readUrlEncodedForm,
} from "@/app/lib/auth";
import { getClientIp } from "@/app/api/_utils/ip";
import {
  checkRateLimit,
  getRateLimitFingerprint,
} from "@/app/api/_utils/rateLimiter";
import { sendPasswordResetEmail } from "@/app/lib/email";
import { createPasswordResetToken } from "@/app/lib/password-reset";
import {
  getPasswordResetBaseUrl,
  PasswordResetUrlConfigError,
} from "@/app/lib/password-reset-url";

export const runtime = "nodejs";

function redirectToReset() {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/reset-hasla?sent=1" },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  let baseUrl: string;
  try {
    baseUrl = getPasswordResetBaseUrl(request);
  } catch (error) {
    if (error instanceof PasswordResetUrlConfigError) {
      console.error("Password reset is unavailable because APP_URL is not configured safely.");
      return new Response("Service unavailable", { status: 503 });
    }
    throw error;
  }

  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(
    "auth-password-reset-request",
    getRateLimitFingerprint(
      clientIp.ip,
      request.headers.get("user-agent") ?? "unknown",
    ),
    { endpointLimit: 5, globalLimit: 20 },
  );
  const formData = await readUrlEncodedForm(request, ["email"]);

  if (!rateLimit.allowed || !formData) {
    return redirectToReset();
  }

  const email = normalizeEmail(formData.get("email"));

  if (!isValidEmail(email)) {
    return redirectToReset();
  }

  const token = await createPasswordResetToken(email).catch((error) => {
    console.error("Password reset token creation failed.", error);
    return null;
  });

  if (token) {
    const resetUrl = new URL("/reset-hasla/nowe", baseUrl);
    resetUrl.searchParams.set("token", token);
    await sendPasswordResetEmail({ to: email, resetUrl: resetUrl.toString() }).catch(
      (error) => {
        console.error("Password reset email failed.", error);
      },
    );
  }

  return redirectToReset();
}
