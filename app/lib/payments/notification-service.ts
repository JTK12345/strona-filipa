import type { P24Config } from "./przelewy24-config";
import type { P24VerificationInput } from "./przelewy24-client";
import {
  getP24NotificationEventId,
  getP24NotificationPayload,
  type ParsedP24Notification,
} from "./przelewy24-notification";
import {
  createP24NotificationSign,
  p24SignaturesMatch,
} from "./przelewy24-signatures";

export type NotificationPurchase = {
  purchaseId: string;
  userId: string;
  courseId: string;
  providerSessionId: string;
  providerOrderId: string | null;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  amountCents: number;
  itemAmountCents: number;
  currency: string;
};

export type PaymentNotificationRepository = {
  recordNotification(eventId: string, payload: object): Promise<string>;
  findPurchase(providerSessionId: string): Promise<NotificationPurchase | null>;
  markNotificationProcessed(eventDatabaseId: string): Promise<void>;
  markNotificationError(
    eventDatabaseId: string,
    errorCode: string,
  ): Promise<void>;
  completePurchase(
    purchase: NotificationPurchase,
    notification: ParsedP24Notification,
    eventDatabaseId: string,
  ): Promise<"paid" | "already_paid">;
};

export type VerificationGateway = {
  verifyTransaction(input: P24VerificationInput): Promise<boolean>;
};

export class PaymentNotificationError extends Error {
  constructor(
    public readonly code:
      | "signature_mismatch"
      | "merchant_mismatch"
      | "purchase_not_found"
      | "purchase_mismatch"
      | "purchase_state"
      | "verification_failed",
    message: string,
  ) {
    super(message);
    this.name = "PaymentNotificationError";
  }
}

function purchaseMatchesNotification(
  purchase: NotificationPurchase,
  notification: ParsedP24Notification,
) {
  return (
    purchase.providerSessionId === notification.sessionId &&
    purchase.amountCents === notification.amount &&
    purchase.itemAmountCents === notification.amount &&
    notification.originAmount === notification.amount &&
    purchase.currency === notification.currency &&
    (!purchase.providerOrderId ||
      purchase.providerOrderId === notification.orderId)
  );
}

export async function processP24Notification(
  notification: ParsedP24Notification,
  dependencies: {
    config: Pick<P24Config, "merchantId" | "posId" | "crc">;
    repository: PaymentNotificationRepository;
    gateway: VerificationGateway;
  },
) {
  if (
    notification.merchantId !== dependencies.config.merchantId ||
    notification.posId !== dependencies.config.posId ||
    notification.currency !== "PLN"
  ) {
    throw new PaymentNotificationError(
      "merchant_mismatch",
      "The notification merchant data is invalid.",
    );
  }

  const expectedSign = createP24NotificationSign(
    notification,
    dependencies.config.crc,
  );

  if (!p24SignaturesMatch(notification.sign, expectedSign)) {
    throw new PaymentNotificationError(
      "signature_mismatch",
      "The notification signature is invalid.",
    );
  }

  const eventDatabaseId = await dependencies.repository.recordNotification(
    getP24NotificationEventId(notification),
    getP24NotificationPayload(notification),
  );
  const purchase = await dependencies.repository.findPurchase(
    notification.sessionId,
  );

  if (!purchase) {
    await dependencies.repository.markNotificationError(
      eventDatabaseId,
      "purchase_not_found",
    );
    throw new PaymentNotificationError(
      "purchase_not_found",
      "The notification purchase does not exist.",
    );
  }

  if (!purchaseMatchesNotification(purchase, notification)) {
    await dependencies.repository.markNotificationError(
      eventDatabaseId,
      "purchase_mismatch",
    );
    throw new PaymentNotificationError(
      "purchase_mismatch",
      "The notification does not match the purchase.",
    );
  }

  if (purchase.status === "paid") {
    await dependencies.repository.markNotificationProcessed(eventDatabaseId);
    return "already_paid" as const;
  }

  if (purchase.status !== "pending") {
    await dependencies.repository.markNotificationError(
      eventDatabaseId,
      "purchase_state",
    );
    throw new PaymentNotificationError(
      "purchase_state",
      "The purchase cannot be paid in its current state.",
    );
  }

  try {
    await dependencies.gateway.verifyTransaction({
      sessionId: notification.sessionId,
      amount: notification.amount,
      currency: "PLN",
      orderId: notification.orderId,
    });
  } catch {
    await dependencies.repository.markNotificationError(
      eventDatabaseId,
      "verification_failed",
    );
    throw new PaymentNotificationError(
      "verification_failed",
      "Przelewy24 did not verify the notification.",
    );
  }

  return dependencies.repository.completePurchase(
    purchase,
    notification,
    eventDatabaseId,
  );
}
