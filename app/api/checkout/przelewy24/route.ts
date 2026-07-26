import { NextResponse } from "next/server";
import { isSameOriginFormRequest } from "@/app/lib/auth";
import { CheckoutError } from "@/app/lib/payments/checkout-service";
import { startPrzelewy24Checkout } from "@/app/lib/payments/przelewy24-checkout";
import { P24ConfigurationError } from "@/app/lib/payments/przelewy24-config";
import { getCurrentUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

const maximumBodySize = 4096;

function errorResponse(
  code: string,
  message: string,
  status: number,
) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return errorResponse("forbidden", "Niedozwolone zrodlo zadania.", 403);
  }

  const session = await getCurrentUserSession();

  if (!session) {
    return errorResponse(
      "authentication_required",
      "Zaloguj sie, aby kupic kurs.",
      401,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumBodySize
  ) {
    return errorResponse("invalid_request", "Nieprawidlowe zadanie.", 413);
  }

  let body: unknown;

  try {
    const rawBody = await request.text();

    if (rawBody.length > maximumBodySize) {
      return errorResponse("invalid_request", "Nieprawidlowe zadanie.", 413);
    }

    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("invalid_request", "Nieprawidlowe zadanie.", 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length !== 3 ||
    !("courseId" in body) ||
    typeof body.courseId !== "string" ||
    !("termsAccepted" in body) ||
    body.termsAccepted !== true ||
    !("digitalContentAccepted" in body) ||
    body.digitalContentAccepted !== true
  ) {
    return errorResponse("invalid_request", "Nieprawidlowe zadanie.", 400);
  }

  try {
    const checkout = await startPrzelewy24Checkout({
      userId: session.userId,
      email: session.email,
      role: session.role,
      courseId: body.courseId,
    });

    return NextResponse.json(checkout, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof P24ConfigurationError) {
      return errorResponse(
        error.code === "disabled" ? "payments_disabled" : "payments_config",
        "Platnosci sa obecnie niedostepne.",
        503,
      );
    }

    if (error instanceof CheckoutError) {
      const status =
        error.code === "already_owned"
          ? 409
          : error.code === "provider_unavailable"
            ? 502
            : 400;
      const message =
        error.code === "already_owned"
          ? "Masz juz dostep do tego kursu."
          : error.code === "course_unavailable"
            ? "Ten kurs nie jest obecnie dostepny w sprzedazy."
            : error.code === "invalid_course"
              ? "Nieprawidlowy kurs."
              : "Nie udalo sie rozpoczac platnosci.";

      return errorResponse(error.code, message, status);
    }

    console.error("Checkout failed with an unexpected error.");
    return errorResponse(
      "checkout_failed",
      "Nie udalo sie rozpoczac platnosci.",
      500,
    );
  }
}
