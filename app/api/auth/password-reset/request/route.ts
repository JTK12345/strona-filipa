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

export const runtime = "nodejs";

function redirectToReset() {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/reset-hasla?sent=1" },
  });
}

function getPublicBaseUrl(request: Request) {
  const configuredAppUrl = process.env.APP_URL?.trim();

  if (configuredAppUrl) {
    try {
      return new URL(configuredAppUrl).origin;
    } catch (error) {
      console.error("APP_URL is invalid.", error);
    }
  }

  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const host = forwardedHost?.split(",")[0]?.trim();

  if (host && host !== "0.0.0.0:3000") {
    const forwardedProto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      "https";

    return `${forwardedProto}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new Response("Forbidden", { status: 403 });
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
    const resetUrl = new URL("/reset-hasla/nowe", getPublicBaseUrl(request));
    resetUrl.searchParams.set("token", token);
    await sendPasswordResetEmail({ to: email, resetUrl: resetUrl.toString() }).catch(
      (error) => {
        console.error("Password reset email failed.", error);
      },
    );
  }

  return redirectToReset();
}
