import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  isSameOriginFormRequest,
  isValidEmail,
  normalizeEmail,
} from "@/app/lib/auth";
import { withDatabaseTransaction } from "@/app/lib/db";
import { createSessionCookie, createUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new NextResponse(null, { status: 403 });
  }

  if (process.env.ENABLE_TEST_CHECKOUT === "false") {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/kup?error=disabled" },
    });
  }

  const formData = await request.formData();
  const email = normalizeEmail(formData.get("email"));

  if (!isValidEmail(email)) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/kup?error=email" },
    });
  }

  const userId = await withDatabaseTransaction(async (client) => {
    await client.query(
      `INSERT INTO users (email)
       VALUES ($1)
       ON CONFLICT (lower(email)) DO NOTHING`,
      [email],
    );
    const userResult = await client.query<{ id: string }>(
      `SELECT id
       FROM users
       WHERE lower(email) = $1
         AND status = 'active'
       LIMIT 1`,
      [email],
    );
    const user = userResult.rows[0];

    if (!user) {
      throw new Error("The test checkout user is not active.");
    }

    const purchaseResult = await client.query<{ id: string }>(
      `INSERT INTO purchases (
         user_id,
         provider,
         provider_order_id,
         status,
         amount_cents,
         paid_at,
         metadata
       )
       VALUES ($1, 'test', $2, 'paid', 0, now(), '{"test": true}'::jsonb)
       RETURNING id`,
      [user.id, `test-${randomUUID()}`],
    );
    const purchaseId = purchaseResult.rows[0].id;

    await client.query(
      `INSERT INTO purchase_items (
         purchase_id,
         item_type,
         title,
         amount_cents
       )
       VALUES ($1, 'all_access', 'Dostęp testowy', 0)`,
      [purchaseId],
    );
    await client.query(
      `INSERT INTO access_grants (
         user_id,
         scope,
         purchase_id,
         source
       )
       VALUES ($1, 'all_access', $2, 'purchase')`,
      [user.id, purchaseId],
    );

    return user.id;
  });

  const token = await createUserSession(userId);
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/panel?purchase=success" },
  });
  response.cookies.set(createSessionCookie(token));

  return response;
}
