import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  AccessCodeError,
  redeemAccessCode,
} from "@/app/lib/access-codes";
import { isSameOriginFormRequest } from "@/app/lib/auth";
import { getCurrentUserSession } from "@/app/lib/session";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";

export const runtime = "nodejs";

function redirectToAccess(result: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/dostep?code=${result}` },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const session = await getCurrentUserSession();

  if (!session) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/logowanie?next=/dostep" },
    });
  }

  const rateLimit = await checkRateLimit("access-code-redeem", session.userId, {
    endpointLimit: 8,
    globalLimit: 20,
  });

  if (!rateLimit.allowed) {
    return redirectToAccess("rate");
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectToAccess("invalid");
  }

  try {
    await redeemAccessCode({
      userId: session.userId,
      code: String(formData.get("code") ?? ""),
    });
    revalidatePath("/dostep");
    revalidatePath("/panel");
    revalidatePath("/kursy");
    return redirectToAccess("success");
  } catch (error) {
    if (error instanceof AccessCodeError) {
      return redirectToAccess(error.code);
    }

    console.error("Access code redemption failed with an unexpected error.");
    return redirectToAccess("server");
  }
}
