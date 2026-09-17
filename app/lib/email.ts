import "server-only";

import { Socket } from "node:net";
import { connect as tlsConnect, TLSSocket } from "node:tls";

type SmtpSocket = Socket | TLSSocket;

type MailInput = {
  to: string;
  subject: string;
  text: string;
};

function readSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from, secure };
}

function encodeHeader(value: string) {
  return /[^\x20-\x7e]/.test(value)
    ? `=?UTF-8?B?${Buffer.from(value).toString("base64")}?=`
    : value;
}

function dotStuff(value: string) {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function waitForLine(socket: SmtpSocket) {
  return new Promise<string>((resolve, reject) => {
    let buffer = "";

    function cleanup() {
      socket.off("data", onData);
      socket.off("error", onError);
    }

    function onError(error: Error) {
      cleanup();
      reject(error);
    }

    function onData(chunk: Buffer) {
      buffer += chunk.toString("utf8");

      if (/\r?\n\d{3} /.test(buffer) || /^\d{3} [\s\S]*\r?\n$/.test(buffer)) {
        cleanup();
        resolve(buffer);
      }
    }

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function command(socket: SmtpSocket, value: string, expected: number[]) {
  socket.write(`${value}\r\n`);
  const response = await waitForLine(socket);
  const code = Number(response.slice(0, 3));

  if (!expected.includes(code)) {
    throw new Error(`SMTP command failed: ${code}`);
  }

  return response;
}

function createSocket(config: ReturnType<typeof readSmtpConfig> & {}) {
  return new Promise<SmtpSocket>((resolve, reject) => {
    const socket = config.secure
      ? tlsConnect(config.port, config.host, { servername: config.host })
      : new Socket().connect(config.port, config.host);

    socket.once("connect", () => resolve(socket));
    socket.once("secureConnect", () => resolve(socket));
    socket.once("error", reject);
    socket.setTimeout(10_000, () => socket.destroy(new Error("SMTP timeout")));
  });
}

async function upgradeToTls(socket: SmtpSocket, host: string) {
  return new Promise<TLSSocket>((resolve, reject) => {
    const tlsSocket = tlsConnect({ socket, servername: host });
    tlsSocket.once("secureConnect", () => resolve(tlsSocket));
    tlsSocket.once("error", reject);
  });
}

export async function sendMail(input: MailInput) {
  const config = readSmtpConfig();

  if (!config) {
    console.warn("SMTP is not configured. An authentication email was not sent.");
    return false;
  }

  let socket = await createSocket(config);

  try {
    await waitForLine(socket);
    await command(socket, `EHLO ${config.host}`, [250]);

    if (!config.secure) {
      await command(socket, "STARTTLS", [220]);
      socket = await upgradeToTls(socket, config.host);
      await command(socket, `EHLO ${config.host}`, [250]);
    }

    await command(socket, "AUTH LOGIN", [334]);
    await command(socket, Buffer.from(config.user).toString("base64"), [334]);
    await command(socket, Buffer.from(config.pass).toString("base64"), [235]);
    await command(socket, `MAIL FROM:<${config.user}>`, [250]);
    await command(socket, `RCPT TO:<${input.to}>`, [250, 251]);
    await command(socket, "DATA", [354]);

    const message = [
      `From: ${config.from}`,
      `To: ${input.to}`,
      `Subject: ${encodeHeader(input.subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      dotStuff(input.text),
      ".",
    ].join("\r\n");

    socket.write(`${message}\r\n`);
    const response = await waitForLine(socket);
    const code = Number(response.slice(0, 3));

    if (code !== 250) {
      throw new Error(`SMTP DATA failed: ${code}`);
    }

    await command(socket, "QUIT", [221]).catch(() => undefined);
    return true;
  } finally {
    socket.destroy();
  }
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}) {
  return sendMail({
    to: input.to,
    subject: "Reset hasła | Świadomy Profil Ciała",
    text: [
      "Otrzymaliśmy prośbę o zresetowanie hasła do konta w serwisie Świadomy Profil Ciała.",
      "",
      "Ustaw nowe hasło, korzystając z linku:",
      input.resetUrl,
      "",
      "Link jest ważny przez 60 minut i działa tylko raz.",
      "Jeśli to nie Ty prosisz o reset hasła, zignoruj tę wiadomość.",
    ].join("\n"),
  });
}

export async function sendEmailVerificationEmail(input: {
  to: string;
  verificationUrl: string;
}) {
  return sendMail({
    to: input.to,
    subject: "Potwierdź adres e-mail | Świadomy Profil Ciała",
    text: [
      "Potwierdź swój adres e-mail, aby aktywować konto w serwisie Świadomy Profil Ciała.",
      "",
      "Otwórz link, a następnie potwierdź aktywację konta:",
      input.verificationUrl,
      "",
      "Link jest ważny przez 24 godziny i działa tylko raz.",
      "Jeśli nie zakładasz konta, zignoruj tę wiadomość.",
    ].join("\n"),
  });
}
