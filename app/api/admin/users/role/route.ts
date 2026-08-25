import { NextResponse } from "next/server";
import {
  AdminRoleError,
  setUserAdminRoleByAdmin,
} from "@/app/lib/admin";
import { isSameOriginFormRequest } from "@/app/lib/auth";
import { getCurrentUserSession } from "@/app/lib/session";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";

export const runtime = "nodejs";

function redirectToAdmin(result: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/panel/admin?role=${result}#uzytkownicy` },
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

  const rateLimit = await checkRateLimit("admin-user-role", session.userId, {
    endpointLimit: 20,
    globalLimit: 40,
  });

  if (!rateLimit.allowed) {
    return redirectToAdmin("rate");
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectToAdmin("invalid");
  }

  const action = String(formData.get("action") ?? "");
  const role = action === "grant-admin" ? "admin" : action === "revoke-admin" ? "user" : null;

  if (!role) {
    return redirectToAdmin("invalid");
  }

  try {
    await setUserAdminRoleByAdmin({
      adminUserId: session.userId,
      targetUserId: String(formData.get("userId") ?? ""),
      role,
    });
    return redirectToAdmin(role === "admin" ? "granted" : "revoked");
  } catch (error) {
    if (error instanceof AdminRoleError) {
      return redirectToAdmin(error.code);
    }

    console.error("Admin role update failed with an unexpected error.");
    return redirectToAdmin("server");
  }
}
