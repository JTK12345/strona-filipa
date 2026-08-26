import { NextResponse } from "next/server";
import {
  type ContactSubmissionStatus,
  updateContactSubmission,
} from "@/app/lib/contact-submissions";
import { isSameOriginFormRequest } from "@/app/lib/auth";
import { getCurrentUserSession } from "@/app/lib/session";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";

export const runtime = "nodejs";

const allowedStatuses = new Set<ContactSubmissionStatus>([
  "new",
  "in_progress",
  "closed",
]);

function redirectToSubmissions(result: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/panel/admin/zgloszenia?submission=${result}` },
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

  const rateLimit = await checkRateLimit("admin-contact-submissions", session.userId, {
    endpointLimit: 30,
    globalLimit: 50,
  });

  if (!rateLimit.allowed) {
    return redirectToSubmissions("rate");
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectToSubmissions("invalid");
  }

  const submissionId = String(formData.get("submissionId") ?? "");
  const status = String(formData.get("status") ?? "") as ContactSubmissionStatus;
  const adminNote = String(formData.get("adminNote") ?? "").trim();

  if (!submissionId || !allowedStatuses.has(status)) {
    return redirectToSubmissions("invalid");
  }

  try {
    await updateContactSubmission({ submissionId, status, adminNote });
    return redirectToSubmissions("updated");
  } catch (error) {
    console.error("Contact submission update failed.", error);
    return redirectToSubmissions("server");
  }
}
