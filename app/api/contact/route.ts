import { NextResponse } from "next/server";
import { createMailerTransport } from "@/app/api/_utils/mailer";
import { logServerError } from "@/app/api/_utils/server-log";
import {
  containsHtml,
  escapeHtml,
  isEmail,
  isPhone,
  logFormSuccess,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  readProtectedForm,
  sanitizeHeaderValue,
} from "@/app/api/_utils/form-security";

export const runtime = "nodejs";

const eventType = "contact_submit";
const allowedFields = [
  "name",
  "phone",
  "email",
  "message",
  "csrfToken",
  "turnstileToken",
  "website",
] as const;

type ContactBody = Record<(typeof allowedFields)[number], unknown>;

export async function POST(req: Request) {
  try {
    const protectedJson = await readProtectedForm<ContactBody>(req, {
      allowedFields: [...allowedFields],
      csrfField: "csrfToken",
      honeypotField: "website",
      turnstileField: "turnstileToken",
      eventType,
      endpointKey: "contact",
    });

    if (protectedJson.error) {
      return protectedJson.error;
    }

    const rawName = normalizeText(protectedJson.body.name, { maxLength: 100 });
    const phone = normalizePhone(protectedJson.body.phone, 32);
    const email = normalizeEmail(protectedJson.body.email, 160);
    const rawMessage = normalizeText(protectedJson.body.message, {
      maxLength: 500,
      multiline: true,
    });
    const name = sanitizeHeaderValue(rawName);
    const message = rawMessage;

    if (!phone && !email) {
      return NextResponse.json(
        { error: "Podaj numer telefonu lub adres e-mail." },
        { status: 400 }
      );
    }

    if (phone && !isPhone(phone)) {
      return NextResponse.json({ error: "Podaj poprawny numer telefonu." }, { status: 400 });
    }

    if (email && !isEmail(email)) {
      return NextResponse.json({ error: "Podaj poprawny adres e-mail." }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: "Wpisz krotka wiadomosc." }, { status: 400 });
    }

    if (containsHtml(String(protectedJson.body.name ?? "")) || containsHtml(String(protectedJson.body.message ?? ""))) {
      return NextResponse.json(
        { error: "Nieprawidlowe dane formularza." },
        { status: 400 }
      );
    }

    const { smtp, transporter } = createMailerTransport();

    await transporter.sendMail({
      from: smtp.from,
      to: smtp.to,
      subject: "Nowa wiadomosc z formularza kontaktowego",
      text: [
        "Nowa wiadomosc z formularza kontaktowego",
        "",
        `Imie: ${name || "Nie podano"}`,
        `Telefon: ${phone || "Nie podano"}`,
        `E-mail: ${email || "Nie podano"}`,
        "",
        "Wiadomosc:",
        message,
      ].join("\n"),
      html: `
        <h1>Nowa wiadomosc z formularza kontaktowego</h1>
        <p><strong>Imie:</strong> ${escapeHtml(name || "Nie podano")}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(phone || "Nie podano")}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(email || "Nie podano")}</p>
        <p><strong>Wiadomosc:</strong><br />${escapeHtml(message).replaceAll(
          "\n",
          "<br />"
        )}</p>
      `,
    });

    logFormSuccess(eventType, protectedJson.ipHash);

    return NextResponse.json({ ok: true }, { headers: protectedJson.rateLimitHeaders });
  } catch (error) {
    logServerError({
      eventType,
      stage: "mail_send_failed",
      error,
    });

    return NextResponse.json(
      { error: "Nie udalo sie wyslac wiadomosci." },
      { status: 500 }
    );
  }
}
