import "server-only";

import { queryDatabase } from "@/app/lib/db";

export type AccountPurchase = {
  publicOrderNumber: string;
  courseTitle: string;
  provider: string;
  status:
    | "pending"
    | "paid"
    | "failed"
    | "cancelled"
    | "refunded"
    | "expired";
  amountCents: number;
  currency: string;
  createdAt: Date;
  paidAt: Date | null;
};

type AccountPurchaseRow = {
  public_order_number: string;
  course_title: string;
  provider: string;
  status: Exclude<AccountPurchase["status"], "expired">;
  amount_cents: number;
  currency: string;
  expires_at: Date | null;
  created_at: Date;
  paid_at: Date | null;
};

export async function getUserPurchaseHistory(userId: string) {
  const result = await queryDatabase<AccountPurchaseRow>(
    `SELECT
       purchases.public_order_number,
       purchase_items.title AS course_title,
       purchases.provider,
       purchases.status,
       purchases.amount_cents,
       purchases.currency,
       purchases.expires_at,
       purchases.created_at,
       purchases.paid_at
     FROM purchases
     JOIN purchase_items
       ON purchase_items.purchase_id = purchases.id
     WHERE purchases.user_id = $1
     ORDER BY purchases.created_at DESC
     LIMIT 50`,
    [userId],
  );

  return result.rows.map<AccountPurchase>((row) => ({
    publicOrderNumber: row.public_order_number,
    courseTitle: row.course_title,
    provider: row.provider,
    status:
      row.status === "pending" &&
      row.expires_at !== null &&
      row.expires_at.getTime() <= Date.now()
        ? "expired"
        : row.status,
    amountCents: row.amount_cents,
    currency: row.currency.trim(),
    createdAt: row.created_at,
    paidAt: row.paid_at,
  }));
}
