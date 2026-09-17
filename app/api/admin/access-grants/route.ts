import { NextResponse } from "next/server";
import {
  AdminAccessRevokeError,
  AdminGrantError,
  grantCourseAccessByAdmin,
  revokeAccessGrantByAdmin,
} from "@/app/lib/admin";
import {
  isSameOriginFormRequest,
  isValidEmail,
  normalizeEmail,
} from "@/app/lib/auth";
import { getCurrentUserSession } from "@/app/lib/session";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";
import { isUuid } from "@/app/lib/course-content";

export const runtime = "nodejs";

function redirectToAdmin(result: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/panel/admin/dostepy?grant=${result}` },
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
  const action = String(formData.get("action") ?? "grant");

  if (action === "revoke") {
    try {
      await revokeAccessGrantByAdmin({
        adminUserId: session.userId,
        grantId: String(formData.get("grantId") ?? ""),
      });
      return redirectToAdmin("revoked");
    } catch (error) {
      if (error instanceof AdminAccessRevokeError) {
        return redirectToAdmin(error.code);
      }

      console.error("Admin access revoke failed with an unexpected error.");
      return redirectToAdmin("server");
    }
  }

  const scope = String(formData.get("scope") ?? "") === "course" ? "course" : "all_access";
  const courseId = String(formData.get("courseId") ?? "");

  if (!isValidEmail(targetEmail) || (scope === "course" && !isUuid(courseId))) {
    return redirectToAdmin("invalid");
  }

  try {
    await grantCourseAccessByAdmin({
      adminUserId: session.userId,
      targetEmail,
      scope,
      courseId: scope === "course" ? courseId : null,
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
