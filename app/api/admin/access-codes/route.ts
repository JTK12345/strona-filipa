import { NextResponse } from "next/server";
import {
  AccessCodeError,
  createAccessCode,
  revokeAccessCode,
} from "@/app/lib/access-codes";
import { isSameOriginFormRequest } from "@/app/lib/auth";
import { getCurrentUserSession } from "@/app/lib/session";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";
import { isUuid } from "@/app/lib/course-content";

export const runtime = "nodejs";

function redirectToAdmin(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/panel/admin/kody?${searchParams.toString()}` },
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

  const rateLimit = await checkRateLimit("admin-access-codes", session.userId, {
    endpointLimit: 20,
    globalLimit: 40,
  });

  if (!rateLimit.allowed) {
    return redirectToAdmin({ accessCode: "rate" });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectToAdmin({ accessCode: "invalid" });
  }

  const action = String(formData.get("action") ?? "");

  if (action === "revoke") {
    const codeId = String(formData.get("codeId") ?? "");
    if (!isUuid(codeId)) {
      return redirectToAdmin({ accessCode: "invalid" });
    }
    await revokeAccessCode(codeId);
    return redirectToAdmin({ accessCode: "revoked" });
  }

  const scope = String(formData.get("scope") ?? "") === "course" ? "course" : "all_access";
  const courseId = String(formData.get("courseId") ?? "");
  const maxUses = Number(formData.get("maxUses") ?? 1);
  const expiresAtValue = String(formData.get("expiresAt") ?? "");
  const expiresAt = expiresAtValue ? new Date(`${expiresAtValue}T23:59:59`) : null;

  if (
    !Number.isInteger(maxUses) ||
    maxUses < 1 ||
    maxUses > 500 ||
    (scope === "course" && (!courseId || !isUuid(courseId))) ||
    (expiresAt && Number.isNaN(expiresAt.getTime()))
  ) {
    return redirectToAdmin({ accessCode: "invalid" });
  }

  let plainCode: string;

  try {
    plainCode = await createAccessCode({
      adminUserId: session.userId,
      label: String(formData.get("label") ?? ""),
      scope,
      courseId: scope === "course" ? courseId : null,
      maxUses,
      expiresAt,
    });
  } catch (error) {
    if (error instanceof AccessCodeError) {
      return redirectToAdmin({ accessCode: error.code });
    }

    console.error("Admin access code creation failed with an unexpected error.");
    return redirectToAdmin({ accessCode: "invalid" });
  }

  return redirectToAdmin({ accessCode: "created", value: plainCode });
}
