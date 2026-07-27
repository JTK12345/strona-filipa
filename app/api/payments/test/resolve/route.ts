import { NextResponse } from "next/server";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";
import {
  isSameOriginFormRequest,
  readUrlEncodedForm,
} from "@/app/lib/auth";
import {
  resolveTestPayment,
  TestPaymentError,
} from "@/app/lib/payments/test-payment-service";
import { getCurrentUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

function redirect(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const session = await getCurrentUserSession();

  if (!session) {
    return redirect("/logowanie?next=/kup");
  }

  const rateLimit = await checkRateLimit(
    "payment-test-resolve",
    session.userId,
    { endpointLimit: 10, globalLimit: 20 },
  );

  if (!rateLimit.allowed) {
    return redirect("/platnosc/niepowodzenie?test=1&reason=rate");
  }

  const form = await readUrlEncodedForm(request, ["order", "outcome"]);
  const publicOrderNumber = form?.get("order") ?? "";
  const outcome = form?.get("outcome") ?? "";

  if (
    !/^PC-[A-F0-9]{16}$/.test(publicOrderNumber) ||
    (outcome !== "success" && outcome !== "failure")
  ) {
    return redirect("/platnosc/niepowodzenie?test=1&reason=invalid");
  }

  try {
    const result = await resolveTestPayment({
      userId: session.userId,
      email: session.email,
      publicOrderNumber,
      outcome,
    });

    if (result === "paid") {
      return redirect(
        `/platnosc/sukces?test=1&order=${encodeURIComponent(publicOrderNumber)}`,
      );
    }

    return redirect(
      `/platnosc/niepowodzenie?test=1&order=${encodeURIComponent(publicOrderNumber)}`,
    );
  } catch (error) {
    const reason =
      error instanceof TestPaymentError ? error.code : "server";
    return redirect(
      `/platnosc/niepowodzenie?test=1&reason=${encodeURIComponent(reason)}`,
    );
  }
}
