import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const recipientEmail = "tomasz.drozd.eti@gmail.com";

type ContactBody = {
  name?: unknown;
  phone?: unknown;
  message?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSmtpConfig() {
  const port = Number(process.env.SMTP_PORT ?? 587);

  return {
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContactBody;
    const name = getString(body.name);
    const phone = getString(body.phone);
    const message = getString(body.message);

    if (!name || !phone || !message) {
      return NextResponse.json(
        { error: "Uzupełnij wszystkie pola formularza." },
        { status: 400 }
      );
    }

    const smtp = getSmtpConfig();

    if (!smtp.host || !smtp.user || !smtp.pass || !smtp.from) {
      console.error("Brak konfiguracji SMTP dla formularza kontaktowego.");

      return NextResponse.json(
        { error: "Formularz nie jest jeszcze skonfigurowany." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from,
      to: recipientEmail,
      subject: `Nowe zgłoszenie z formularza: ${name}`,
      text: [
        "Nowe zgłoszenie z formularza kontaktowego.",
        "",
        `Imię: ${name}`,
        `Telefon: ${phone}`,
        "",
        "Wiadomość:",
        message,
      ].join("\n"),
      html: `
        <h1>Nowe zgłoszenie z formularza kontaktowego</h1>
        <p><strong>Imię:</strong> ${escapeHtml(name)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Wiadomość:</strong></p>
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Błąd wysyłki formularza kontaktowego:", error);

    return NextResponse.json(
      { error: "Nie udało się wysłać wiadomości." },
      { status: 500 }
    );
  }
}
