import "server-only";

import type { PoolClient } from "pg";
import { queryDatabase, withDatabaseTransaction } from "@/app/lib/db";
import { Przelewy24Client } from "./przelewy24-client";
import { getP24Config } from "./przelewy24-config";
import {
  type NotificationPurchase,
  PaymentNotificationError,
  processP24Notification,
} from "./notification-service";
import type { ParsedP24Notification } from "./przelewy24-notification";

type PurchaseRow = {
  purchase_id: string;
  user_id: string;
  course_id: string;
  provider_session_id: string;
  provider_order_id: string | null;
  status: NotificationPurchase["status"];
  amount_cents: number;
  item_amount_cents: number;
  currency: string;
};

function mapPurchase(row: PurchaseRow): NotificationPurchase {
  return {
    purchaseId: row.purchase_id,
    userId: row.user_id,
    courseId: row.course_id,
    providerSessionId: row.provider_session_id,
    providerOrderId: row.provider_order_id,
    status: row.status,
    amountCents: row.amount_cents,
    itemAmountCents: row.item_amount_cents,
    currency: row.currency.trim(),
  };
}

async function selectPurchase(
  client: PoolClient | null,
  providerSessionId: string,
  lock: boolean,
) {
  const text = `SELECT
       purchases.id AS purchase_id,
       purchases.user_id,
       purchase_items.course_id,
       purchases.provider_session_id,
       purchases.provider_order_id,
       purchases.status,
       purchases.amount_cents,
       purchase_items.amount_cents AS item_amount_cents,
       purchases.currency
     FROM purchases
     JOIN purchase_items
       ON purchase_items.purchase_id = purchases.id
      AND purchase_items.item_type = 'course'
     WHERE purchases.provider = 'przelewy24'
       AND purchases.provider_session_id = $1
     LIMIT 1
     ${lock ? "FOR UPDATE OF purchases" : ""}`;
  const values = [providerSessionId];
  const result = client
    ? await client.query<PurchaseRow>(text, values)
    : await queryDatabase<PurchaseRow>(text, values);

  return result.rows[0] ? mapPurchase(result.rows[0]) : null;
}

function assertPurchaseStillMatches(
  purchase: NotificationPurchase,
  notification: ParsedP24Notification,
) {
  if (
    purchase.providerSessionId !== notification.sessionId ||
    purchase.amountCents !== notification.amount ||
    purchase.itemAmountCents !== notification.amount ||
    purchase.currency !== notification.currency ||
    (purchase.providerOrderId &&
      purchase.providerOrderId !== notification.orderId)
  ) {
    throw new PaymentNotificationError(
      "purchase_mismatch",
      "The purchase changed before it could be completed.",
    );
  }
}

const repository = {
  async recordNotification(eventId: string, payload: object) {
    const result = await queryDatabase<{ id: string }>(
      `INSERT INTO payment_events (
         provider,
         provider_event_id,
         event_type,
         payload
       )
       VALUES ('przelewy24', $1, 'payment_notification', $2::jsonb)
       ON CONFLICT (provider, provider_event_id)
       DO UPDATE SET
         payload = EXCLUDED.payload,
         error_message = NULL
       RETURNING id`,
      [eventId, JSON.stringify(payload)],
    );
    const event = result.rows[0];

    if (!event) {
      throw new Error("The payment event could not be stored.");
    }

    return event.id;
  },

  async findPurchase(providerSessionId: string) {
    return selectPurchase(null, providerSessionId, false);
  },

  async markNotificationProcessed(eventDatabaseId: string) {
    await queryDatabase(
      `UPDATE payment_events
       SET processed_at = COALESCE(processed_at, now()),
           error_message = NULL
       WHERE id = $1
         AND provider = 'przelewy24'`,
      [eventDatabaseId],
    );
  },

  async markNotificationError(
    eventDatabaseId: string,
    errorCode: string,
  ) {
    await queryDatabase(
      `UPDATE payment_events
       SET error_message = $2
       WHERE id = $1
         AND provider = 'przelewy24'
         AND processed_at IS NULL`,
      [eventDatabaseId, errorCode],
    );
  },

  async completePurchase(
    expectedPurchase: NotificationPurchase,
    notification: ParsedP24Notification,
    eventDatabaseId: string,
  ) {
    return withDatabaseTransaction(async (client) => {
      const purchase = await selectPurchase(
        client,
        notification.sessionId,
        true,
      );

      if (!purchase || purchase.purchaseId !== expectedPurchase.purchaseId) {
        throw new PaymentNotificationError(
          "purchase_not_found",
          "The purchase disappeared before completion.",
        );
      }

      assertPurchaseStillMatches(purchase, notification);

      if (purchase.status === "paid") {
        await client.query(
          `UPDATE payment_events
           SET processed_at = COALESCE(processed_at, now()),
               error_message = NULL
           WHERE id = $1`,
          [eventDatabaseId],
        );
        return "already_paid" as const;
      }

      if (purchase.status !== "pending") {
        throw new PaymentNotificationError(
          "purchase_state",
          "The purchase cannot be completed.",
        );
      }

      await client.query(
        `UPDATE purchases
         SET status = 'paid',
             provider_order_id = $2,
             paid_at = now()
         WHERE id = $1`,
        [purchase.purchaseId, notification.orderId],
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
        [purchase.userId, purchase.courseId, purchase.purchaseId],
      );
      await client.query(
        `UPDATE payment_events
         SET processed_at = now(),
             error_message = NULL
         WHERE id = $1`,
        [eventDatabaseId],
      );

      return "paid" as const;
    });
  },
};

export async function handlePrzelewy24Status(
  notification: ParsedP24Notification,
) {
  const config = getP24Config();

  return processP24Notification(notification, {
    config,
    repository,
    gateway: new Przelewy24Client(config),
  });
}
