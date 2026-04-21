import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { readProtectedFormData, readProtectedJson } from "@/app/api/_utils/form-security";

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

function isFormPost(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

function createRedirectUrl(req: Request, contact: "sent" | "missing" | "error") {
  const url = new URL(req.url);
  url.pathname = "/";
  url.search = `?contact=${contact}`;
  url.hash = "kontakt";
  return url;
}

export async function POST(req: Request) {
  const fallbackMode = isFormPost(req);

  try {
    let body: ContactBody;

    if (fallbackMode) {
      const protectedFormData = await readProtectedFormData(req);

      if (protectedFormData.error) {
        return NextResponse.redirect(createRedirectUrl(req, "error"), 303);
      }

      const formData = protectedFormData.formData;
      body = {
        name: formData?.get("name"),
        phone: formData?.get("phone"),
        message: formData?.get("message"),
      };
    } else {
      const protectedJson = await readProtectedJson<ContactBody>(req);

      if (protectedJson.error) {
        return protectedJson.error;
      }

      body = protectedJson.body;
    }

    const name = getString(body.name);
    const phone = getString(body.phone);
    const message = getString(body.message);

    if (!name || !phone || !message) {
      if (fallbackMode) {
        return NextResponse.redirect(createRedirectUrl(req, "missing"), 303);
      }

      return NextResponse.json(
        { error: "Uzupe\u0142nij wszystkie pola formularza." },
        { status: 400 }
      );
    }

    const smtp = getSmtpConfig();

    if (!smtp.host || !smtp.user || !smtp.pass || !smtp.from) {
      console.error("Brak konfiguracji SMTP dla formularza kontaktowego.");

      if (fallbackMode) {
        return NextResponse.redirect(createRedirectUrl(req, "error"), 303);
      }

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
      subject: `Nowe zg\u0142oszenie z formularza: ${name}`,
      text: [
        "Nowe zg\u0142oszenie z formularza kontaktowego.",
        "",
        `Imi\u0119: ${name}`,
        `Telefon: ${phone}`,
        "",
        "Wiadomo\u015b\u0107:",
        message,
      ].join("\n"),
      html: `
        <h1>Nowe zg\u0142oszenie z formularza kontaktowego</h1>
        <p><strong>Imi\u0119:</strong> ${escapeHtml(name)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Wiadomo\u015b\u0107:</strong></p>
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
    });

    if (fallbackMode) {
      return NextResponse.redirect(createRedirectUrl(req, "sent"), 303);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("B\u0142\u0105d wysy\u0142ki formularza kontaktowego:", error);

    if (fallbackMode) {
      return NextResponse.redirect(createRedirectUrl(req, "error"), 303);
    }

    return NextResponse.json(
      { error: "Nie uda\u0142o si\u0119 wys\u0142a\u0107 wiadomo\u015bci." },
      { status: 500 }
    );
  }
}
