import { NextResponse } from "next/server";
import {
  PaymentNotificationError,
} from "@/app/lib/payments/notification-service";
import {
  parseP24Notification,
} from "@/app/lib/payments/przelewy24-notification";
import { P24ConfigurationError } from "@/app/lib/payments/przelewy24-config";
import { handlePrzelewy24Status } from "@/app/lib/payments/przelewy24-status";

export const runtime = "nodejs";

const maximumBodySize = 32 * 1024;

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumBodySize
  ) {
    return new NextResponse(null, { status: 413 });
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (!rawBody || rawBody.length > maximumBodySize) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const notification = parseP24Notification(rawBody);
    const status = await handlePrzelewy24Status(notification);

    return NextResponse.json(
      { status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof TypeError) {
      return new NextResponse(null, { status: 400 });
    }

    if (error instanceof P24ConfigurationError) {
      return new NextResponse(null, { status: 503 });
    }

    if (error instanceof PaymentNotificationError) {
      return new NextResponse(null, {
        status: error.code === "verification_failed" ? 502 : 400,
      });
    }

    console.error("P24 notification failed with an unexpected error.");
    return new NextResponse(null, { status: 500 });
  }
}
