"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CheckoutCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  modules: string[];
  price: string;
  priceCents: number | null;
  salesEnabled: boolean;
  owned: boolean;
};

type CheckoutErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

const errorMessages: Record<string, string> = {
  already_owned: "Ten kurs jest już dostępny na Twoim koncie.",
  course_unavailable: "Ten kurs nie jest obecnie dostępny w sprzedaży.",
  payments_disabled: "Płatności są obecnie wyłączone.",
  rate_limited:
    "Wykonano zbyt wiele prób płatności. Odczekaj kilka minut i spróbuj ponownie.",
  provider_unavailable:
    "Nie udało się połączyć z operatorem płatności. Spróbuj ponownie później.",
};

export function CourseCheckout({
  courses,
  selectedSlug,
  isAuthenticated,
  paymentsEnabled,
}: {
  courses: CheckoutCourse[];
  selectedSlug?: string;
  isAuthenticated: boolean;
  paymentsEnabled: boolean;
}) {
  const initialCourse =
    courses.find((course) => course.slug === selectedSlug) ?? courses[0];
  const [selectedCourseId, setSelectedCourseId] = useState(
    initialCourse?.id ?? "",
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [digitalContentAccepted, setDigitalContentAccepted] = useState(false);
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );
  const canPurchase =
    Boolean(selectedCourse) &&
    isAuthenticated &&
    paymentsEnabled &&
    selectedCourse?.salesEnabled &&
    !selectedCourse?.owned &&
    termsAccepted &&
    digitalContentAccepted &&
    state !== "submitting";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCourse || !canPurchase) {
      return;
    }

    setState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/checkout/przelewy24", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          termsAccepted,
          digitalContentAccepted,
        }),
      });
      const body = (await response.json()) as CheckoutErrorResponse & {
        redirectUrl?: string;
      };

      if (!response.ok || !body.redirectUrl) {
        const code = body.error?.code ?? "checkout_failed";
        throw new Error(
          errorMessages[code] ??
            body.error?.message ??
            "Nie udało się rozpocząć płatności.",
        );
      }

      window.location.assign(body.redirectUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nie udało się rozpocząć płatności.",
      );
      setState("error");
    }
  }

  if (courses.length === 0) {
    return (
      <div className="panel-empty purchase-empty">
        <h2>Oferta kursów jest w przygotowaniu.</h2>
        <p>Opublikowane kursy pojawią się tutaj automatycznie.</p>
      </div>
    );
  }

  return (
    <form className="purchase-layout" onSubmit={handleSubmit}>
      <fieldset className="course-selector">
        <legend>Wybierz kurs</legend>
        <div className="course-selector__list">
          {courses.map((course) => {
            const isSelected = selectedCourseId === course.id;

            return (
              <label
                key={course.id}
                className={`course-choice${isSelected ? " course-choice--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="course"
                  value={course.id}
                  checked={isSelected}
                  onChange={() => setSelectedCourseId(course.id)}
                />
                <span className="course-choice__marker" aria-hidden="true" />
                <span className="course-choice__content">
                  <span className="course-choice__topline">
                    <strong>{course.title}</strong>
                    <b>{course.price}</b>
                  </span>
                  <span className="course-choice__description">
                    {course.description}
                  </span>
                  <span className="course-choice__meta">
                    {course.duration} · {course.level} · {course.modules.length}{" "}
                    {course.modules.length === 1 ? "moduł" : "modułów"}
                  </span>
                  {course.owned ? (
                    <span className="course-choice__owned">Masz już dostęp</span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <aside className="order-summary">
        <div className="order-summary__heading">
          <p className="checkout-plan__name">Podsumowanie</p>
          <h2>{selectedCourse?.title ?? "Wybierz kurs"}</h2>
        </div>

        <div className="order-summary__price">
          <span>Do zapłaty</span>
          <strong>{selectedCourse?.price ?? "—"}</strong>
          <small>Płatność jednorazowa</small>
        </div>

        <div className="order-summary__details">
          <p>
            <strong>Dostęp:</strong> zakupiony kurs, jego filmy, notatki i
            materiały.
          </p>
          <p>
            <strong>Konto:</strong> dostęp zostanie przypisany po potwierdzeniu
            płatności.
          </p>
        </div>

        <div className="checkout-consents">
          <label>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              required
            />
            <span>
              Akceptuję{" "}
              <Link href="/regulamin" target="_blank">
                regulamin
              </Link>{" "}
              i zapoznałem/am się z{" "}
              <Link href="/polityka-prywatnosci" target="_blank">
                polityką prywatności
              </Link>
              .
            </span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={digitalContentAccepted}
              onChange={(event) =>
                setDigitalContentAccepted(event.target.checked)
              }
              required
            />
            <span>
              Wyrażam uprzednią zgodę na rozpoczęcie dostarczania treści
              cyfrowych przed upływem terminu odstąpienia oraz przyjmuję do
              wiadomości, że po spełnieniu świadczenia utracę prawo odstąpienia.
            </span>
          </label>
        </div>

        {errorMessage ? (
          <p className="purchase-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {!isAuthenticated ? (
          <Link href="/logowanie?next=/kup" className="button-primary">
            Zaloguj się, aby kupić
          </Link>
        ) : (
          <button
            type="submit"
            className="button-primary"
            disabled={!canPurchase}
          >
            {state === "submitting"
              ? "Łączenie z Przelewy24..."
              : selectedCourse?.owned
                ? "Kurs jest już dostępny"
                : !selectedCourse?.salesEnabled || !paymentsEnabled
                  ? "Sprzedaż jeszcze nieaktywna"
                  : "Kupuję i płacę"}
          </button>
        )}

        <p className="order-summary__provider">
          Bezpieczna płatność obsługiwana przez Przelewy24.
        </p>
      </aside>
    </form>
  );
}
