import { NextResponse } from "next/server";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";
import { isSameOriginFormRequest } from "@/app/lib/auth";
import { Przelewy24Client } from "@/app/lib/payments/przelewy24-client";
import {
  getP24Config,
  P24ConfigurationError,
} from "@/app/lib/payments/przelewy24-config";
import { getCurrentUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

function redirectToAdmin(result: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/panel/admin?p24=${result}#p24` },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const session = await getCurrentUserSession();

  if (!session || session.role !== "admin") {
    return new NextResponse(null, { status: 403 });
  }

  const rateLimit = await checkRateLimit("admin-p24-test", session.userId, {
    endpointLimit: 5,
    globalLimit: 20,
  });

  if (!rateLimit.allowed) {
    return redirectToAdmin("rate");
  }

  try {
    const client = new Przelewy24Client(getP24Config());
    await client.testAccess();
    return redirectToAdmin("success");
  } catch (error) {
    if (error instanceof P24ConfigurationError) {
      return redirectToAdmin(
        error.code === "disabled" ? "disabled" : "config",
      );
    }

    console.error("P24 testAccess failed.");
    return redirectToAdmin("failed");
  }
}
