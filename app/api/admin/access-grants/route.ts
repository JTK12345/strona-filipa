import { NextResponse } from "next/server";
import {
  AdminGrantError,
  grantCourseAccessByAdmin,
} from "@/app/lib/admin";
import {
  isSameOriginFormRequest,
  isValidEmail,
  normalizeEmail,
} from "@/app/lib/auth";
import { getCurrentUserSession } from "@/app/lib/session";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";

export const runtime = "nodejs";

function redirectToAdmin(result: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/panel/admin?grant=${result}` },
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

  const rateLimit = await checkRateLimit(
    "admin-access-grant",
    session.userId,
    { endpointLimit: 10, globalLimit: 20 },
  );

  if (!rateLimit.allowed) {
    return redirectToAdmin("rate");
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectToAdmin("invalid");
  }

  const targetEmail = normalizeEmail(formData.get("email"));
  const courseId = String(formData.get("courseId") ?? "");

  if (!isValidEmail(targetEmail)) {
    return redirectToAdmin("invalid");
  }

  try {
    await grantCourseAccessByAdmin({
      adminUserId: session.userId,
      targetEmail,
      courseId,
    });
    return redirectToAdmin("success");
  } catch (error) {
    if (error instanceof AdminGrantError) {
      return redirectToAdmin(error.code);
    }

    console.error("Admin access grant failed with an unexpected error.");
    return redirectToAdmin("server");
  }
}
