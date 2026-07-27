import { NextResponse } from "next/server";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";
import { readCheckoutRequest } from "@/app/api/checkout/checkout-request";
import { isSameOriginFormRequest } from "@/app/lib/auth";
import { CheckoutError } from "@/app/lib/payments/checkout-service";
import {
  startTestPaymentCheckout,
  TestPaymentError,
} from "@/app/lib/payments/test-payment-service";
import { getCurrentUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return errorResponse("forbidden", "Niedozwolone źródło żądania.", 403);
  }

  const session = await getCurrentUserSession();

  if (!session) {
    return errorResponse(
      "authentication_required",
      "Zaloguj się, aby przetestować zakup.",
      401,
    );
  }

  const rateLimit = await checkRateLimit(
    "checkout-test",
    session.userId,
    { endpointLimit: 8, globalLimit: 20 },
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message: "Zbyt wiele prób rozpoczęcia płatności testowej.",
        },
      },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const body = await readCheckoutRequest(request);

  if (!body) {
    return errorResponse("invalid_request", "Nieprawidłowe żądanie.", 400);
  }

  try {
    const checkout = await startTestPaymentCheckout({
      userId: session.userId,
      email: session.email,
      role: session.role,
      courseId: body.courseId,
    });

    return NextResponse.json(checkout, {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
        ...Object.fromEntries(rateLimit.headers),
      },
    });
  } catch (error) {
    if (error instanceof TestPaymentError) {
      return errorResponse(
        "test_payments_disabled",
        "Płatności testowe nie są dostępne dla tego konta.",
        403,
      );
    }

    if (error instanceof CheckoutError) {
      const status = error.code === "already_owned" ? 409 : 400;
      const message =
        error.code === "already_owned"
          ? "Masz już dostęp do tego kursu."
          : error.code === "course_unavailable"
            ? "Ten kurs nie jest obecnie dostępny w sprzedaży."
            : "Nieprawidłowy kurs.";

      return errorResponse(error.code, message, status);
    }

    console.error("Test checkout failed with an unexpected error.");
    return errorResponse(
      "checkout_failed",
      "Nie udało się rozpocząć płatności testowej.",
      500,
    );
  }
}
