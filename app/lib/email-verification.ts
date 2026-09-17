import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { isDatabaseConfigured, queryDatabase, withDatabaseTransaction } from "@/app/lib/db";

const verificationTokenDurationHours = 24;

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(userId: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashEmailVerificationToken(token);

  const result = await queryDatabase<{ id: string }>(
    `UPDATE users
     SET updated_at = now()
     WHERE id = $1
       AND status = 'active'
       AND email_verified_at IS NULL
     RETURNING id`,
    [userId],
  );

  if (!result.rows[0]) {
    return null;
  }

  await queryDatabase(
    `UPDATE email_verification_tokens
     SET used_at = now()
     WHERE user_id = $1
       AND used_at IS NULL`,
    [userId],
  );
  await queryDatabase(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3::text || ' hours')::interval)`,
    [userId, tokenHash, verificationTokenDurationHours],
  );
  await queryDatabase(
    "DELETE FROM email_verification_tokens WHERE expires_at < now() - interval '1 day'",
  );

  return token;
}

export async function createEmailVerificationTokenForEmail(email: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const result = await queryDatabase<{ id: string }>(
    `SELECT id
     FROM users
     WHERE lower(email) = $1
       AND status = 'active'
       AND email_verified_at IS NULL
     LIMIT 1`,
    [email],
  );

  return result.rows[0]
    ? createEmailVerificationToken(result.rows[0].id)
    : null;
}

export async function getEmailVerificationTokenState(token: string) {
  if (!token || !isDatabaseConfigured()) {
    return "invalid" as const;
  }

  const result = await queryDatabase<{
    expires_at: Date;
    used_at: Date | null;
    email_verified_at: Date | null;
  }>(
    `SELECT tokens.expires_at, tokens.used_at, users.email_verified_at
     FROM email_verification_tokens tokens
     JOIN users ON users.id = tokens.user_id
     WHERE tokens.token_hash = $1
     LIMIT 1`,
    [hashEmailVerificationToken(token)],
  );
  const verificationToken = result.rows[0];

  if (!verificationToken || verificationToken.used_at || verificationToken.email_verified_at) {
    return "invalid" as const;
  }

  return verificationToken.expires_at.getTime() > Date.now()
    ? ("valid" as const)
    : ("expired" as const);
}

export async function verifyEmailWithToken(token: string) {
  if (!isDatabaseConfigured()) {
    return "invalid" as const;
  }

  return withDatabaseTransaction(async (client) => {
    const result = await client.query<{
      id: string;
      user_id: string;
      expires_at: Date;
      used_at: Date | null;
      email_verified_at: Date | null;
    }>(
      `SELECT tokens.id, tokens.user_id, tokens.expires_at, tokens.used_at,
              users.email_verified_at
       FROM email_verification_tokens tokens
       JOIN users ON users.id = tokens.user_id
       WHERE tokens.token_hash = $1
       FOR UPDATE`,
      [hashEmailVerificationToken(token)],
    );
    const verificationToken = result.rows[0];

    if (!verificationToken || verificationToken.used_at || verificationToken.email_verified_at) {
      return "invalid" as const;
    }

    if (verificationToken.expires_at.getTime() <= Date.now()) {
      return "expired" as const;
    }

    await client.query(
      "UPDATE users SET email_verified_at = now() WHERE id = $1 AND email_verified_at IS NULL",
      [verificationToken.user_id],
    );
    await client.query(
      "UPDATE email_verification_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL",
      [verificationToken.user_id],
    );
    return "verified" as const;
  });
}
