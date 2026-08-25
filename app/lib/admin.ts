import "server-only";

import { withDatabaseTransaction, queryDatabase } from "@/app/lib/db";

type AdminPurchaseRow = {
  public_order_number: string;
  buyer_email: string;
  course_title: string;
  provider: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  amount_cents: number;
  currency: string;
  provider_order_id: string | null;
  created_at: Date;
  paid_at: Date | null;
};

type AdminPaymentEventRow = {
  id: string;
  event_type: string;
  processed_at: Date | null;
  error_message: string | null;
  created_at: Date;
};

type AdminUserRow = {
  id: string;
  email: string;
  role: "user" | "admin";
};

type AdminCourseRow = {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
};

type AdminAuditRow = {
  id: string;
  admin_email: string;
  target_email: string | null;
  course_title: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: Date;
};

export async function getAdminDashboard() {
  const [purchases, events, users, courses, auditEvents] = await Promise.all([
    queryDatabase<AdminPurchaseRow>(
      `SELECT
         purchases.public_order_number,
         purchases.buyer_email,
         purchase_items.title AS course_title,
         purchases.provider,
         purchases.status,
         purchases.amount_cents,
         purchases.currency,
         purchases.provider_order_id,
         purchases.created_at,
         purchases.paid_at
       FROM purchases
       JOIN purchase_items
         ON purchase_items.purchase_id = purchases.id
       ORDER BY purchases.created_at DESC
       LIMIT 100`,
    ),
    queryDatabase<AdminPaymentEventRow>(
      `SELECT id, event_type, processed_at, error_message, created_at
       FROM payment_events
       ORDER BY created_at DESC
       LIMIT 100`,
    ),
    queryDatabase<AdminUserRow>(
      `SELECT id, email, role
       FROM users
       WHERE status = 'active'
       ORDER BY lower(email)
       LIMIT 500`,
    ),
    queryDatabase<AdminCourseRow>(
      `SELECT id, title, status
       FROM courses
       WHERE status <> 'archived'
       ORDER BY position, created_at`,
    ),
    queryDatabase<AdminAuditRow>(
      `SELECT
         audit.id,
         admins.email AS admin_email,
         targets.email AS target_email,
         courses.title AS course_title,
         audit.action,
         audit.metadata,
         audit.created_at
       FROM admin_audit_events audit
       JOIN users admins ON admins.id = audit.admin_user_id
       LEFT JOIN users targets ON targets.id = audit.target_user_id
       LEFT JOIN courses ON courses.id = audit.course_id
       ORDER BY audit.created_at DESC
       LIMIT 50`,
    ),
  ]);

  return {
    purchases: purchases.rows,
    events: events.rows,
    users: users.rows,
    courses: courses.rows,
    auditEvents: auditEvents.rows,
    adminCount: users.rows.filter((user) => user.role === "admin").length,
    userCount: users.rows.filter((user) => user.role === "user").length,
  };
}

export class AdminRoleError extends Error {
  constructor(
    public readonly code:
      | "invalid"
      | "user_not_found"
      | "already_admin"
      | "already_user"
      | "last_admin",
  ) {
    super(code);
    this.name = "AdminRoleError";
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function setUserAdminRoleByAdmin(input: {
  adminUserId: string;
  targetUserId: string;
  role: "user" | "admin";
}) {
  if (!isUuid(input.targetUserId)) {
    throw new AdminRoleError("invalid");
  }

  return withDatabaseTransaction(async (client) => {
    const targetResult = await client.query<{
      id: string;
      role: "user" | "admin";
    }>(
      `SELECT id, role
       FROM users
       WHERE id = $1
         AND status = 'active'
       FOR UPDATE`,
      [input.targetUserId],
    );
    const targetUser = targetResult.rows[0];

    if (!targetUser) {
      throw new AdminRoleError("user_not_found");
    }

    if (targetUser.role === input.role) {
      throw new AdminRoleError(
        input.role === "admin" ? "already_admin" : "already_user",
      );
    }

    if (targetUser.role === "admin" && input.role === "user") {
      const adminCountResult = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count
         FROM users
         WHERE role = 'admin'
           AND status = 'active'`,
      );
      const adminCount = Number(adminCountResult.rows[0]?.count ?? 0);

      if (adminCount <= 1) {
        throw new AdminRoleError("last_admin");
      }
    }

    await client.query(
      `UPDATE users
       SET role = $2
       WHERE id = $1`,
      [targetUser.id, input.role],
    );
    await client.query(
      `INSERT INTO admin_audit_events (
         admin_user_id,
         action,
         target_user_id,
         metadata
       )
       VALUES (
         $1,
         $2,
         $3,
         jsonb_build_object('previous_role', $4, 'new_role', $5)
       )`,
      [
        input.adminUserId,
        input.role === "admin" ? "admin_role_granted" : "admin_role_revoked",
        targetUser.id,
        targetUser.role,
        input.role,
      ],
    );

    return { targetUserId: targetUser.id, role: input.role };
  });
}

export class AdminGrantError extends Error {
  constructor(
    public readonly code:
      | "invalid"
      | "user_not_found"
      | "course_not_found"
      | "already_granted",
  ) {
    super(code);
    this.name = "AdminGrantError";
  }
}

export async function grantCourseAccessByAdmin(input: {
  adminUserId: string;
  targetEmail: string;
  scope: "all_access" | "course";
  courseId: string | null;
}) {
  if (
    input.scope === "course" &&
    (!input.courseId || !isUuid(input.courseId))
  ) {
    throw new AdminGrantError("invalid");
  }

  return withDatabaseTransaction(async (client) => {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [`admin-grant:${input.targetEmail}:${input.scope}:${input.courseId ?? "all"}`],
    );

    const userResult = await client.query<{
      id: string;
      role: "user" | "admin";
    }>(
      `SELECT id, role
       FROM users
       WHERE lower(email) = $1
         AND status = 'active'
       LIMIT 1`,
      [input.targetEmail],
    );
    const targetUser = userResult.rows[0];

    if (!targetUser) {
      throw new AdminGrantError("user_not_found");
    }

    if (input.scope === "course") {
      const courseResult = await client.query<{ id: string }>(
        `SELECT id
         FROM courses
         WHERE id = $1
           AND status <> 'archived'
         LIMIT 1`,
        [input.courseId],
      );

      if (!courseResult.rows[0]) {
        throw new AdminGrantError("course_not_found");
      }
    }

    const accessResult = await client.query<{ has_access: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM access_grants
         WHERE user_id = $1
           AND revoked_at IS NULL
           AND (expires_at IS NULL OR expires_at > now())
           AND (
             scope = 'all_access'
             OR ($2::text = 'course' AND scope = 'course' AND course_id = $3)
           )
       ) AS has_access`,
      [targetUser.id, input.scope, input.courseId],
    );

    if (
      targetUser.role === "admin" ||
      accessResult.rows[0]?.has_access === true
    ) {
      throw new AdminGrantError("already_granted");
    }

    await client.query(
      `INSERT INTO access_grants (
         user_id,
         scope,
         course_id,
         source
       )
       VALUES ($1, $2, $3, 'admin')`,
      [
        targetUser.id,
        input.scope,
        input.scope === "course" ? input.courseId : null,
      ],
    );
    await client.query(
      `INSERT INTO admin_audit_events (
         admin_user_id,
         action,
         target_user_id,
         course_id,
         metadata
       )
       VALUES (
         $1,
         'course_access_granted',
         $2,
         $3,
         jsonb_build_object('source', 'admin_panel', 'scope', $4::text)
       )`,
      [input.adminUserId, targetUser.id, input.courseId, input.scope],
    );

    return { targetUserId: targetUser.id };
  });
}
