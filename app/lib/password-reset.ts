import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { hashPassword, isValidPassword } from "@/app/lib/auth";
import {
  isDatabaseConfigured,
  queryDatabase,
  withDatabaseTransaction,
} from "@/app/lib/db";

const resetTokenDurationMinutes = 60;

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(email: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(token);

  const result = await queryDatabase<{ id: string }>(
    `SELECT id
     FROM users
     WHERE lower(email) = $1
       AND status = 'active'
       AND password_hash IS NOT NULL
     LIMIT 1`,
    [email],
  );
  const user = result.rows[0];

  if (!user) {
    return null;
  }

  await queryDatabase(
    `UPDATE password_reset_tokens
     SET used_at = now()
     WHERE user_id = $1
       AND used_at IS NULL`,
    [user.id],
  );
  await queryDatabase(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3::text || ' minutes')::interval)`,
    [user.id, tokenHash, resetTokenDurationMinutes],
  );
  await queryDatabase("DELETE FROM password_reset_tokens WHERE expires_at < now() - interval '1 day'");

  return token;
}

export async function getPasswordResetTokenState(token: string) {
  if (!token || !isDatabaseConfigured()) {
    return "invalid" as const;
  }

  const result = await queryDatabase<{
    expires_at: Date;
    used_at: Date | null;
  }>(
    `SELECT expires_at, used_at
     FROM password_reset_tokens
     WHERE token_hash = $1
     LIMIT 1`,
    [hashResetToken(token)],
  );
  const resetToken = result.rows[0];

  if (!resetToken || resetToken.used_at) {
    return "invalid" as const;
  }

  if (resetToken.expires_at.getTime() <= Date.now()) {
    return "expired" as const;
  }

  return "valid" as const;
}

export class PasswordResetError extends Error {
  constructor(public readonly code: "invalid" | "expired" | "weak_password") {
    super(code);
    this.name = "PasswordResetError";
  }
}

export async function resetPasswordWithToken(input: {
  token: string;
  password: string;
}) {
  if (!isDatabaseConfigured()) {
    throw new PasswordResetError("invalid");
  }

  if (!isValidPassword(input.password)) {
    throw new PasswordResetError("weak_password");
  }

  const passwordHash = await hashPassword(input.password);
  const tokenHash = hashResetToken(input.token);

  return withDatabaseTransaction(async (client) => {
    const tokenResult = await client.query<{
      id: string;
      user_id: string;
      expires_at: Date;
      used_at: Date | null;
    }>(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = $1
       FOR UPDATE`,
      [tokenHash],
    );
    const resetToken = tokenResult.rows[0];

    if (!resetToken || resetToken.used_at) {
      throw new PasswordResetError("invalid");
    }

    if (resetToken.expires_at.getTime() <= Date.now()) {
      throw new PasswordResetError("expired");
    }

    await client.query(
      `UPDATE users
       SET password_hash = $2
       WHERE id = $1
         AND status = 'active'`,
      [resetToken.user_id, passwordHash],
    );
    await client.query(
      `UPDATE password_reset_tokens
       SET used_at = now()
       WHERE id = $1`,
      [resetToken.id],
    );
    await client.query("DELETE FROM user_sessions WHERE user_id = $1", [
      resetToken.user_id,
    ]);

    return { userId: resetToken.user_id };
  });
}
