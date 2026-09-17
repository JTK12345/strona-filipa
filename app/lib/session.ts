import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { queryDatabase } from "@/app/lib/db";
import {
  clearSessionCookie as buildClearSessionCookie,
  createSessionCookie as buildSessionCookie,
  getSessionCookieName,
} from "@/app/lib/session-cookie";

export const sessionCookieName = getSessionCookieName(
  process.env.NODE_ENV === "production",
);

export type UserRole = "user" | "admin";

export type UserSession = {
  sessionId: string;
  userId: string;
  email: string;
  role: UserRole;
  hasAnyAccess: boolean;
  hasLibraryAccess: boolean;
};

type SessionRow = {
  session_id: string;
  user_id: string;
  email: string;
  role: UserRole;
  has_any_access: boolean;
  has_library_access: boolean;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionCookie(token: string) {
  return buildSessionCookie(token, process.env.NODE_ENV === "production");
}

export function clearSessionCookie() {
  return buildClearSessionCookie(process.env.NODE_ENV === "production");
}

export async function createUserSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);

  await queryDatabase(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '30 days')`,
    [userId, tokenHash],
  );
  await queryDatabase("DELETE FROM user_sessions WHERE expires_at <= now()");

  return token;
}

export async function deleteUserSession(token: string | undefined) {
  if (!token) {
    return;
  }

  await queryDatabase("DELETE FROM user_sessions WHERE token_hash = $1", [
    hashSessionToken(token),
  ]);
}

export const getCurrentUserSession = cache(async (): Promise<UserSession | null> => {
  const token = (await cookies()).get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const result = await queryDatabase<SessionRow>(
    `SELECT
       sessions.id AS session_id,
       users.id AS user_id,
       users.email,
       users.role,
       EXISTS (
         SELECT 1
         FROM access_grants grants
         WHERE grants.user_id = users.id
           AND grants.revoked_at IS NULL
           AND (grants.expires_at IS NULL OR grants.expires_at > now())
       ) AS has_any_access,
       EXISTS (
         SELECT 1
         FROM access_grants grants
         WHERE grants.user_id = users.id
           AND grants.scope IN ('library', 'all_access')
           AND grants.revoked_at IS NULL
           AND (grants.expires_at IS NULL OR grants.expires_at > now())
       ) AS has_library_access
     FROM user_sessions sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1
       AND sessions.expires_at > now()
       AND users.status = 'active'
     LIMIT 1`,
    [hashSessionToken(token)],
  );
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  const isAdmin = row.role === "admin";

  return {
    sessionId: row.session_id,
    userId: row.user_id,
    email: row.email,
    role: row.role,
    hasAnyAccess: isAdmin || row.has_any_access,
    hasLibraryAccess: isAdmin || row.has_library_access,
  };
});
