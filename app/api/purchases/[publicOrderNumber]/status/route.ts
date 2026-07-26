import { NextResponse } from "next/server";
import { getUserPurchaseStatus } from "@/app/lib/payments/purchase-status";
import { getCurrentUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/purchases/[publicOrderNumber]/status">,
) {
  const session = await getCurrentUserSession();

  if (!session) {
    return NextResponse.json(
      { error: { code: "authentication_required" } },
      { status: 401 },
    );
  }

  const { publicOrderNumber } = await context.params;

  if (!/^PC-[A-F0-9]{16}$/.test(publicOrderNumber)) {
    return NextResponse.json(
      { error: { code: "purchase_not_found" } },
      { status: 404 },
    );
  }

  const purchase = await getUserPurchaseStatus(
    session.userId,
    publicOrderNumber,
  );

  if (!purchase) {
    return NextResponse.json(
      { error: { code: "purchase_not_found" } },
      { status: 404 },
    );
  }

  return NextResponse.json(purchase, {
    headers: { "Cache-Control": "no-store" },
  });
}
