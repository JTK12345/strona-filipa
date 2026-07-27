import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { withDatabaseTransaction } from "@/app/lib/db";
import { CheckoutError } from "./checkout-service";
import { isTestPaymentAllowed } from "./test-payment-config";

type CourseRow = {
  id: string;
  title: string;
  price_cents: number | null;
  currency: string;
  status: "draft" | "published" | "archived";
  access_type: "free" | "paid";
  sales_enabled: boolean;
};

type TestPurchaseRow = {
  purchase_id: string;
  user_id: string;
  course_id: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  expires_at: Date | null;
};

export class TestPaymentError extends Error {
  constructor(
    public readonly code:
      | "disabled"
      | "not_found"
      | "expired"
      | "invalid_state",
  ) {
    super(code);
    this.name = "TestPaymentError";
  }
}

function assertCourseId(courseId: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      courseId,
    )
  ) {
    throw new CheckoutError("invalid_course", "Invalid course identifier.");
  }
}

async function userAlreadyOwnsCourse(
  client: PoolClient,
  userId: string,
  courseId: string,
) {
  const result = await client.query<{ owns_course: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM access_grants
       WHERE user_id = $1
         AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > now())
         AND (
           scope = 'all_access'
           OR (scope = 'course' AND course_id = $2)
         )
     ) AS owns_course`,
    [userId, courseId],
  );

  return result.rows[0]?.owns_course === true;
}

export async function startTestPaymentCheckout(input: {
  userId: string;
  email: string;
  role: "user" | "admin";
  courseId: string;
}) {
  if (!isTestPaymentAllowed(input.email)) {
    throw new TestPaymentError("disabled");
  }

  assertCourseId(input.courseId);

  if (input.role === "admin") {
    throw new CheckoutError(
      "already_owned",
      "Administrators already have access to all courses.",
    );
  }

  return withDatabaseTransaction(async (client) => {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [`checkout:${input.userId}:${input.courseId}`],
    );

    const courseResult = await client.query<CourseRow>(
      `SELECT
         id,
         title,
         price_cents,
         currency,
         status,
         access_type,
         sales_enabled
       FROM courses
       WHERE id = $1
       LIMIT 1
       FOR SHARE`,
      [input.courseId],
    );
    const course = courseResult.rows[0];

    if (
      !course ||
      course.status !== "published" ||
      course.access_type !== "paid" ||
      !course.sales_enabled ||
      course.price_cents === null ||
      course.price_cents <= 0 ||
      course.currency.trim() !== "PLN"
    ) {
      throw new CheckoutError(
        "course_unavailable",
        "This course is not currently available for purchase.",
      );
    }

    if (await userAlreadyOwnsCourse(client, input.userId, input.courseId)) {
      throw new CheckoutError(
        "already_owned",
        "This account already has access to the course.",
      );
    }

    const randomPart = randomUUID()
      .replaceAll("-", "")
      .slice(0, 16)
      .toUpperCase();
    const publicOrderNumber = `PC-${randomPart}`;
    const providerSessionId = `test_${randomBytes(32).toString("base64url")}`;
    const purchaseResult = await client.query<{ id: string }>(
      `INSERT INTO purchases (
         user_id,
         provider,
         provider_session_id,
         public_order_number,
         buyer_email,
         status,
         amount_cents,
         currency,
         expires_at,
         metadata
       )
       VALUES (
         $1,
         'test',
         $2,
         $3,
         $4,
         'pending',
         $5,
         $6,
         now() + interval '30 minutes',
         jsonb_build_object(
           'test', true,
           'courseId', $7::text,
           'legalVersion', 'draft-2026-07-27',
           'termsAcceptedAt', now(),
           'digitalContentConsentAt', now()
         )
       )
       RETURNING id`,
      [
        input.userId,
        providerSessionId,
        publicOrderNumber,
        input.email,
        course.price_cents,
        course.currency.trim(),
        course.id,
      ],
    );
    const purchaseId = purchaseResult.rows[0]?.id;

    if (!purchaseId) {
      throw new Error("The test purchase was not created.");
    }

    await client.query(
      `INSERT INTO purchase_items (
         purchase_id,
         item_type,
         course_id,
         title,
         amount_cents
       )
       VALUES ($1, 'course', $2, $3, $4)`,
      [purchaseId, course.id, course.title, course.price_cents],
    );

    return {
      purchaseId,
      publicOrderNumber,
      redirectUrl: `/platnosc/test?order=${encodeURIComponent(publicOrderNumber)}`,
    };
  });
}

async function selectTestPurchase(
  client: PoolClient,
  userId: string,
  publicOrderNumber: string,
) {
  const result = await client.query<TestPurchaseRow>(
    `SELECT
       purchases.id AS purchase_id,
       purchases.user_id,
       purchase_items.course_id,
       purchases.status,
       purchases.expires_at
     FROM purchases
     JOIN purchase_items
       ON purchase_items.purchase_id = purchases.id
      AND purchase_items.item_type = 'course'
     WHERE purchases.provider = 'test'
       AND purchases.user_id = $1
       AND purchases.public_order_number = $2
     LIMIT 1
     FOR UPDATE OF purchases`,
    [userId, publicOrderNumber],
  );

  return result.rows[0] ?? null;
}

export async function resolveTestPayment(input: {
  userId: string;
  email: string;
  publicOrderNumber: string;
  outcome: "success" | "failure";
}) {
  if (!isTestPaymentAllowed(input.email)) {
    throw new TestPaymentError("disabled");
  }

  return withDatabaseTransaction(async (client) => {
    const purchase = await selectTestPurchase(
      client,
      input.userId,
      input.publicOrderNumber,
    );

    if (!purchase) {
      throw new TestPaymentError("not_found");
    }

    if (
      (purchase.status === "paid" && input.outcome === "success") ||
      (purchase.status === "failed" && input.outcome === "failure")
    ) {
      return purchase.status;
    }

    if (purchase.status !== "pending") {
      throw new TestPaymentError("invalid_state");
    }

    if (
      purchase.expires_at &&
      purchase.expires_at.getTime() <= Date.now()
    ) {
      throw new TestPaymentError("expired");
    }

    const providerEventId = `${purchase.purchase_id}:${input.outcome}`;
    await client.query(
      `INSERT INTO payment_events (
         provider,
         provider_event_id,
         event_type,
         payload,
         processed_at
       )
       VALUES (
         'test',
         $1,
         'test_payment_resolution',
         jsonb_build_object('outcome', $2::text),
         now()
       )
       ON CONFLICT (provider, provider_event_id) DO NOTHING`,
      [providerEventId, input.outcome],
    );

    if (input.outcome === "failure") {
      await client.query(
        `UPDATE purchases
         SET status = 'failed',
             metadata = metadata || '{"testOutcome":"failure"}'::jsonb
         WHERE id = $1`,
        [purchase.purchase_id],
      );
      return "failed" as const;
    }

    await client.query(
      `UPDATE purchases
       SET status = 'paid',
           provider_order_id = $2,
           paid_at = now(),
           metadata = metadata || '{"testOutcome":"success"}'::jsonb
       WHERE id = $1`,
      [purchase.purchase_id, `TEST-${purchase.purchase_id}`],
    );
    await client.query(
      `INSERT INTO access_grants (
         user_id,
         scope,
         course_id,
         purchase_id,
         source
       )
       VALUES ($1, 'course', $2, $3, 'purchase')
       ON CONFLICT DO NOTHING`,
      [purchase.user_id, purchase.course_id, purchase.purchase_id],
    );

    return "paid" as const;
  });
}
