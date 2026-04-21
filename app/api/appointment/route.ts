import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { readProtectedJson } from "@/app/api/_utils/form-security";

export const runtime = "nodejs";

const recipientEmail = "tomasz.drozd.eti@gmail.com";

type AppointmentBody = {
  fullName?: unknown;
  phone?: unknown;
  email?: unknown;
  visitType?: unknown;
  preferredDates?: unknown;
  goal?: unknown;
  previousClient?: unknown;
  notes?: unknown;
};

const requiredFields: Array<keyof AppointmentBody> = [
  "fullName",
  "phone",
  "email",
  "visitType",
  "preferredDates",
  "goal",
  "previousClient",
];

const fieldLabels: Record<keyof AppointmentBody, string> = {
  fullName: "Imi\u0119 i nazwisko",
  phone: "Telefon",
  email: "Adres e-mail",
  visitType: "Preferowana forma konsultacji",
  preferredDates: "Preferowane dni i godziny",
  goal: "G\u0142\u00f3wny cel konsultacji",
  previousClient: "Czy osoba jest po wcze\u015bniejszej wsp\u00f3\u0142pracy?",
  notes: "Dodatkowe informacje",
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

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const protectedJson = await readProtectedJson<AppointmentBody>(req);

    if (protectedJson.error) {
      return protectedJson.error;
    }

    const body = protectedJson.body;
    const appointment = Object.fromEntries(
      Object.keys(fieldLabels).map((key) => [
        key,
        getString(body[key as keyof AppointmentBody]),
      ])
    ) as Record<keyof AppointmentBody, string>;

    const hasMissingFields = requiredFields.some((field) => !appointment[field]);

    if (hasMissingFields) {
      return NextResponse.json(
        { error: "Uzupe\u0142nij wszystkie wymagane pola." },
        { status: 400 }
      );
    }

    if (!isEmail(appointment.email)) {
      return NextResponse.json(
        { error: "Podaj poprawny adres e-mail." },
        { status: 400 }
      );
    }

    const smtp = getSmtpConfig();

    if (!smtp.host || !smtp.user || !smtp.pass || !smtp.from) {
      console.error("Brak konfiguracji SMTP dla formularza konsultacji.");

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

    const textRows = Object.entries(fieldLabels).map(([key, label]) => {
      const value = appointment[key as keyof AppointmentBody] || "Brak odpowiedzi";
      return `${label}:\n${value}`;
    });

    const htmlRows = Object.entries(fieldLabels)
      .map(([key, label]) => {
        const value = appointment[key as keyof AppointmentBody] || "Brak odpowiedzi";

        return `
          <section style="margin: 0 0 18px;">
            <h2 style="font-size: 16px; margin: 0 0 6px;">${escapeHtml(label)}</h2>
            <p style="margin: 0; white-space: pre-line;">${escapeHtml(value)}</p>
          </section>
        `;
      })
      .join("");

    await transporter.sendMail({
      from: smtp.from,
      to: recipientEmail,
      replyTo: appointment.email,
      subject: `Pro\u015bba o konsultacj\u0119: ${appointment.fullName}`,
      text: ["Pro\u015bba o konsultacj\u0119", "", ...textRows].join("\n\n"),
      html: `
        <h1>Pro\u015bba o konsultacj\u0119</h1>
        ${htmlRows}
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("B\u0142\u0105d wysy\u0142ki formularza konsultacji:", error);

    return NextResponse.json(
      { error: "Nie uda\u0142o si\u0119 wys\u0142a\u0107 zg\u0142oszenia." },
      { status: 500 }
    );
  }
}
