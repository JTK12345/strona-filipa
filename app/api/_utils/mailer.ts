import nodemailer from "nodemailer";

export function getSmtpConfig() {
  const port = Number(process.env.SMTP_PORT ?? 587);

  return {
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to: process.env.MAIL_TO ?? process.env.SMTP_USER,
  };
}

export function createMailerTransport() {
  const smtp = getSmtpConfig();

  if (!smtp.host || !smtp.user || !smtp.pass || !smtp.from || !smtp.to) {
    throw new Error("missing_smtp_config");
  }

  return {
    smtp,
    transporter: nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    }),
  };
}
