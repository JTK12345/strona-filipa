import { NextResponse } from "next/server";
import { isSameOriginFormRequest, readUrlEncodedForm } from "@/app/lib/auth";
import { verifyEmailWithToken } from "@/app/lib/email-verification";
import { getClientIp } from "@/app/api/_utils/ip";
import { checkRateLimit, getRateLimitFingerprint } from "@/app/api/_utils/rateLimiter";

export const runtime = "nodejs";

function redirectToVerification(result: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/potwierdz-email?${new URLSearchParams({ result })}` },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(
    "auth-email-verification-confirm",
    getRateLimitFingerprint(clientIp.ip, request.headers.get("user-agent") ?? "unknown"),
    { endpointLimit: 10, globalLimit: 30 },
  );
  const formData = await readUrlEncodedForm(request, ["token"]);

  if (!rateLimit.allowed || !formData) {
    return redirectToVerification("invalid");
  }

  const result = await verifyEmailWithToken(String(formData.get("token") ?? ""));

  if (result === "verified") {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/logowanie?verification=verified" },
    });
  }

  return redirectToVerification(result);
}
