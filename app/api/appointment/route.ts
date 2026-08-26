import { NextResponse } from "next/server";
import { getClientIp } from "@/app/api/_utils/ip";
import {
  checkRateLimit,
  getRateLimitFingerprint,
} from "@/app/api/_utils/rateLimiter";
import {
  isSameOriginFormRequest,
  isValidEmail,
  normalizeEmail,
} from "@/app/lib/auth";
import { createContactSubmission } from "@/app/lib/contact-submissions";
import { sendMail } from "@/app/lib/email";

export const runtime = "nodejs";

const maxAppointmentBodyBytes = 12 * 1024;

function redirectToAppointment(result: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/umow-konsultacje?status=${result}` },
  });
}

function normalizeText(value: FormDataEntryValue | null, maxLength: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeMessage(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 3000);
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const clientIp = getClientIp(request);
  const declaredLength = Number(request.headers.get("content-length") ?? "0");

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maxAppointmentBodyBytes
  ) {
    return redirectToAppointment("invalid");
  }

  const rateLimit = await checkRateLimit(
    "appointment-request",
    getRateLimitFingerprint(
      clientIp.ip,
      request.headers.get("user-agent") ?? "unknown",
    ),
    { endpointLimit: 5, globalLimit: 20 },
  );

  if (!rateLimit.allowed) {
    return redirectToAppointment("rate");
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectToAppointment("invalid");
  }

  const name = normalizeText(formData.get("name"), 120);
  const email = normalizeEmail(formData.get("email"));
  const phone = normalizeText(formData.get("phone"), 40);
  const topic = normalizeText(formData.get("topic"), 160);
  const message = normalizeMessage(formData.get("message"));

  if (name.length < 2 || !isValidEmail(email) || message.length < 10) {
    return redirectToAppointment("invalid");
  }

  try {
    await createContactSubmission({ name, email, phone, topic, message });

    if (process.env.MAIL_TO) {
      await sendMail({
        to: process.env.MAIL_TO,
        subject: "Nowe zgłoszenie konsultacji",
        text: [
          "Nowe zgłoszenie konsultacji zapisane w panelu admina.",
          "",
          `Imię: ${name}`,
          `E-mail: ${email}`,
          `Telefon: ${phone || "brak"}`,
          `Temat: ${topic || "brak"}`,
          "",
          message,
        ].join("\n"),
      }).catch((error) => {
        console.error("Appointment notification email failed.", error);
      });
    }
  } catch (error) {
    console.error("Appointment request failed.", error);
    return redirectToAppointment("server");
  }

  return redirectToAppointment("sent");
}
