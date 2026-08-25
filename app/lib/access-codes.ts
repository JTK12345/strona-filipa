import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { withDatabaseTransaction, queryDatabase } from "@/app/lib/db";

export class AccessCodeError extends Error {
  constructor(
    public readonly code:
      | "invalid"
      | "not_found"
      | "expired"
      | "used"
      | "already_has_access"
      | "already_redeemed",
  ) {
    super(code);
    this.name = "AccessCodeError";
  }
}

type AccessCodeRow = {
  id: string;
  label: string;
  scope: "library" | "all_access" | "course";
  course_id: string | null;
  course_title: string | null;
  max_uses: number;
  used_count: number;
  expires_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
};

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function hashCode(code: string) {
  return createHash("sha256").update(normalizeCode(code)).digest("hex");
}

export function createPlainAccessCode() {
  return randomBytes(9).toString("base64url").toUpperCase();
}

export async function listAccessCodes() {
  const result = await queryDatabase<AccessCodeRow>(
    `SELECT
       access_codes.id,
       access_codes.label,
       access_codes.scope,
       access_codes.course_id,
       courses.title AS course_title,
       access_codes.max_uses,
       access_codes.used_count,
       access_codes.expires_at,
       access_codes.revoked_at,
       access_codes.created_at
     FROM access_codes
     LEFT JOIN courses ON courses.id = access_codes.course_id
     ORDER BY access_codes.created_at DESC
     LIMIT 100`,
  );

  return result.rows;
}

export async function createAccessCode(input: {
  adminUserId: string;
  label: string;
  scope: "all_access" | "course";
  courseId: string | null;
  maxUses: number;
  expiresAt: Date | null;
}) {
  const plainCode = createPlainAccessCode();

  await withDatabaseTransaction(async (client) => {
    if (input.scope === "course") {
      if (!input.courseId) {
        throw new AccessCodeError("invalid");
      }

      const courseResult = await client.query(
        `SELECT 1
         FROM courses
         WHERE id = $1
           AND status <> 'archived'
         LIMIT 1`,
        [input.courseId],
      );

      if (!courseResult.rows[0]) {
        throw new AccessCodeError("invalid");
      }
    }

    await client.query(
      `INSERT INTO access_codes (
         code_hash,
         label,
         scope,
         course_id,
         max_uses,
         expires_at,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        hashCode(plainCode),
        input.label.trim().slice(0, 120),
        input.scope,
        input.scope === "course" ? input.courseId : null,
        input.maxUses,
        input.expiresAt,
        input.adminUserId,
      ],
    );
  });

  return plainCode;
}

export async function revokeAccessCode(codeId: string) {
  await queryDatabase(
    `UPDATE access_codes
     SET revoked_at = now()
     WHERE id = $1
       AND revoked_at IS NULL`,
    [codeId],
  );
}

export async function redeemAccessCode(input: {
  userId: string;
  code: string;
}) {
  const normalizedCode = normalizeCode(input.code);

  if (normalizedCode.length < 8 || normalizedCode.length > 64) {
    throw new AccessCodeError("invalid");
  }

  return withDatabaseTransaction(async (client) => {
    const codeResult = await client.query<{
      id: string;
      scope: "library" | "all_access" | "course";
      course_id: string | null;
      max_uses: number;
      used_count: number;
      expires_at: Date | null;
      revoked_at: Date | null;
    }>(
      `SELECT id, scope, course_id, max_uses, used_count, expires_at, revoked_at
       FROM access_codes
       WHERE code_hash = $1
       FOR UPDATE`,
      [hashCode(normalizedCode)],
    );
    const accessCode = codeResult.rows[0];

    if (!accessCode) {
      throw new AccessCodeError("not_found");
    }

    if (
      accessCode.revoked_at ||
      (accessCode.expires_at && accessCode.expires_at <= new Date())
    ) {
      throw new AccessCodeError("expired");
    }

    if (accessCode.used_count >= accessCode.max_uses) {
      throw new AccessCodeError("used");
    }

    const existingRedemption = await client.query(
      `SELECT 1
       FROM access_code_redemptions
       WHERE access_code_id = $1
         AND user_id = $2
       LIMIT 1`,
      [accessCode.id, input.userId],
    );

    if (existingRedemption.rows[0]) {
      throw new AccessCodeError("already_redeemed");
    }

    const activeAccess = await client.query(
      `SELECT 1
       FROM access_grants
       WHERE user_id = $1
         AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > now())
         AND (
           scope = 'all_access'
           OR ($2::text = 'library' AND scope = 'library')
           OR ($2::text = 'course' AND scope = 'course' AND course_id = $3)
         )
       LIMIT 1`,
      [input.userId, accessCode.scope, accessCode.course_id],
    );

    if (activeAccess.rows[0]) {
      throw new AccessCodeError("already_has_access");
    }

    await client.query(
      `INSERT INTO access_grants (user_id, scope, course_id, source)
       VALUES ($1, $2, $3, 'code')`,
      [
        input.userId,
        accessCode.scope,
        accessCode.scope === "course" ? accessCode.course_id : null,
      ],
    );
    await client.query(
      `INSERT INTO access_code_redemptions (access_code_id, user_id)
       VALUES ($1, $2)`,
      [accessCode.id, input.userId],
    );
    await client.query(
      `UPDATE access_codes
       SET used_count = used_count + 1
       WHERE id = $1`,
      [accessCode.id],
    );

    return { scope: accessCode.scope, courseId: accessCode.course_id };
  });
}
