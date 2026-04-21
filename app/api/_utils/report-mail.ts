import nodemailer from "nodemailer";
import * as XLSX from "xlsx";

const recipientEmail = "tomasz.drozd.eti@gmail.com";

export function getString(value: unknown) {
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

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

export function getReportRows<T extends string>(
  fieldLabels: Record<T, string>,
  report: Record<T, string>
) {
  return (Object.keys(fieldLabels) as T[]).map((key) => ({
    label: fieldLabels[key],
    value: report[key] || "Brak odpowiedzi",
  }));
}

function createWorkbookBuffer(reportTitle: string, rows: Array<{ label: string; value: string }>) {
  const worksheetRows = [
    ["Raport", reportTitle],
    ["Data utworzenia", new Date().toLocaleString("pl-PL")],
    [],
    ["Pole", "Odpowied\u017a"],
    ...rows.map((row) => [row.label, row.value]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetRows);
  worksheet["!cols"] = [{ wch: 42 }, { wch: 72 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Odpowiedzi");

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
    compression: true,
  });
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 80);
}

export async function sendReportEmail<T extends string>({
  reportTitle,
  subject,
  replyTo,
  fullName,
  fieldLabels,
  report,
}: {
  reportTitle: string;
  subject: string;
  replyTo: string;
  fullName: string;
  fieldLabels: Record<T, string>;
  report: Record<T, string>;
}) {
  const smtp = getSmtpConfig();

  if (!smtp.host || !smtp.user || !smtp.pass || !smtp.from) {
    throw new Error("missing_smtp_config");
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

  const rows = getReportRows(fieldLabels, report);
  const textRows = rows.map((row) => `${row.label}:\n${row.value}`);
  const htmlRows = rows
    .map(
      (row) => `
        <section style="margin: 0 0 18px;">
          <h2 style="font-size: 16px; margin: 0 0 6px;">${escapeHtml(row.label)}</h2>
          <p style="margin: 0; white-space: pre-line;">${escapeHtml(row.value)}</p>
        </section>
      `
    )
    .join("");

  const workbookBuffer = createWorkbookBuffer(reportTitle, rows);
  const fileBaseName = sanitizeFilename(`${reportTitle}-${fullName || "raport"}`);

  await transporter.sendMail({
    from: smtp.from,
    to: recipientEmail,
    replyTo,
    subject,
    text: [reportTitle, "", ...textRows].join("\n\n"),
    html: `
      <h1>${escapeHtml(reportTitle)}</h1>
      ${htmlRows}
    `,
    attachments: [
      {
        filename: `${fileBaseName}.xlsx`,
        content: workbookBuffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });
}
