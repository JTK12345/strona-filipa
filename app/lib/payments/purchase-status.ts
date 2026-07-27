import "server-only";

import { queryDatabase } from "@/app/lib/db";

type PurchaseStatusRow = {
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  public_order_number: string;
  course_title: string;
  amount_cents: number;
  currency: string;
  expires_at: Date | null;
};

export async function getUserPurchaseStatus(
  userId: string,
  publicOrderNumber: string,
) {
  const result = await queryDatabase<PurchaseStatusRow>(
    `SELECT
       purchases.status,
       purchases.public_order_number,
       purchase_items.title AS course_title,
       purchases.amount_cents,
       purchases.currency,
       purchases.expires_at
     FROM purchases
     JOIN purchase_items
       ON purchase_items.purchase_id = purchases.id
      AND purchase_items.item_type = 'course'
     WHERE purchases.user_id = $1
       AND purchases.provider IN ('przelewy24', 'test')
       AND purchases.public_order_number = $2
     LIMIT 1`,
    [userId, publicOrderNumber],
  );
  const purchase = result.rows[0];

  if (!purchase) {
    return null;
  }

  const isExpired =
    purchase.status === "pending" &&
    purchase.expires_at !== null &&
    purchase.expires_at.getTime() <= Date.now();

  return {
    status: isExpired ? ("expired" as const) : purchase.status,
    publicOrderNumber: purchase.public_order_number,
    courseTitle: purchase.course_title,
    amountCents: purchase.amount_cents,
    currency: purchase.currency.trim(),
  };
}
