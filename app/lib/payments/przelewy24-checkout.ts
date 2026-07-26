import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { withDatabaseTransaction, queryDatabase } from "@/app/lib/db";
import {
  CheckoutError,
  createCourseCheckout,
  type CreatePendingPurchaseInput,
  type PendingCoursePurchase,
} from "./checkout-service";
import { Przelewy24Client } from "./przelewy24-client";
import { getP24Config } from "./przelewy24-config";

type CourseRow = {
  id: string;
  title: string;
  price_cents: number | null;
  currency: string;
  status: "draft" | "published" | "archived";
  access_type: "free" | "paid";
  sales_enabled: boolean;
};

function createIdentifiers() {
  const randomPart = randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();

  return {
    providerSessionId: `p24_${randomBytes(32).toString("base64url")}`,
    publicOrderNumber: `PC-${randomPart}`,
  };
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

async function createPendingPurchase(
  input: CreatePendingPurchaseInput,
): Promise<PendingCoursePurchase> {
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
         'przelewy24',
         $2,
         $3,
         $4,
         'pending',
         $5,
         $6,
         now() + interval '15 minutes',
         jsonb_build_object('courseId', $7::text)
       )
       RETURNING id`,
      [
        input.userId,
        input.providerSessionId,
        input.publicOrderNumber,
        input.buyerEmail,
        course.price_cents,
        course.currency.trim(),
        course.id,
      ],
    );
    const purchaseId = purchaseResult.rows[0]?.id;

    if (!purchaseId) {
      throw new Error("The pending purchase was not created.");
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
      publicOrderNumber: input.publicOrderNumber,
      providerSessionId: input.providerSessionId,
      buyerEmail: input.buyerEmail,
      courseId: course.id,
      courseTitle: course.title,
      amountCents: course.price_cents,
      currency: "PLN",
    };
  });
}

async function markPurchaseRegistered(
  purchaseId: string,
  providerToken: string,
) {
  const result = await queryDatabase(
    `UPDATE purchases
     SET provider_token = $2,
         provider_registered_at = now()
     WHERE id = $1
       AND provider = 'przelewy24'
       AND status = 'pending'
       AND provider_token IS NULL`,
    [purchaseId, providerToken],
  );

  if (result.rowCount !== 1) {
    throw new Error("The registered purchase could not be updated.");
  }
}

async function markPurchaseRegistrationFailed(
  purchaseId: string,
  reason: string,
) {
  await queryDatabase(
    `UPDATE purchases
     SET status = 'failed',
         metadata = metadata || jsonb_build_object(
           'registrationError',
           $2::text
         )
     WHERE id = $1
       AND provider = 'przelewy24'
       AND status = 'pending'
       AND provider_token IS NULL`,
    [purchaseId, reason.slice(0, 100)],
  );
}

export async function startPrzelewy24Checkout(input: {
  userId: string;
  email: string;
  role: "user" | "admin";
  courseId: string;
}) {
  const config = getP24Config();
  const gateway = new Przelewy24Client(config);

  return createCourseCheckout(
    {
      ...input,
      appUrl: config.appUrl,
    },
    {
      repository: {
        createPendingPurchase,
        markPurchaseRegistered,
        markPurchaseRegistrationFailed,
      },
      gateway,
      createIdentifiers,
    },
  );
}
