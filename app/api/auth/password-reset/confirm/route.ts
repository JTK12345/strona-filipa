import { NextResponse } from "next/server";
import {
  isSameOriginFormRequest,
  readUrlEncodedForm,
} from "@/app/lib/auth";
import { getClientIp } from "@/app/api/_utils/ip";
import {
  checkRateLimit,
  getRateLimitFingerprint,
} from "@/app/api/_utils/rateLimiter";
import {
  PasswordResetError,
  resetPasswordWithToken,
} from "@/app/lib/password-reset";

export const runtime = "nodejs";

function redirectToForm(token: string, error: string) {
  const searchParams = new URLSearchParams({ error });

  if (token) {
    searchParams.set("token", token);
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/reset-hasla/nowe?${searchParams.toString()}` },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(
    "auth-password-reset-confirm",
    getRateLimitFingerprint(
      clientIp.ip,
      request.headers.get("user-agent") ?? "unknown",
    ),
    { endpointLimit: 8, globalLimit: 20 },
  );
  const formData = await readUrlEncodedForm(request, [
    "token",
    "password",
    "passwordConfirmation",
  ]);

  if (!rateLimit.allowed || !formData) {
    return redirectToForm("", rateLimit.allowed ? "invalid" : "rate");
  }

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "");

  if (password !== passwordConfirmation) {
    return redirectToForm(token, "mismatch");
  }

  try {
    await resetPasswordWithToken({ token, password });
  } catch (error) {
    if (error instanceof PasswordResetError) {
      return redirectToForm(token, error.code);
    }

    console.error("Password reset failed.", error);
    return redirectToForm(token, "server");
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/logowanie?reset=changed" },
  });
}
