"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PurchaseStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "expired";

type StatusResponse = {
  status: PurchaseStatus;
  publicOrderNumber: string;
  courseTitle: string;
  amountCents: number;
  currency: string;
};

const terminalStatuses = new Set<PurchaseStatus>([
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "expired",
]);

export function PaymentStatus({ orderNumber }: { orderNumber: string }) {
  const [purchase, setPurchase] = useState<StatusResponse | null>(null);
  const [state, setState] = useState<
    "checking" | "ready" | "timeout" | "error"
  >("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function checkStatus() {
      try {
        const response = await fetch(
          `/api/purchases/${encodeURIComponent(orderNumber)}/status`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          setState("error");
          return;
        }

        const body = (await response.json()) as StatusResponse;
        setPurchase(body);

        if (terminalStatuses.has(body.status)) {
          setState("ready");
          return;
        }

        if (Date.now() - startedAt >= 60_000) {
          setState("timeout");
          return;
        }

        timer = setTimeout(checkStatus, 2000);
      } catch {
        if (!controller.signal.aborted) {
          setState("error");
        }
      }
    }

    void checkStatus();

    return () => {
      controller.abort();
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [attempt, orderNumber]);

  if (state === "checking") {
    return (
      <div className="payment-result payment-result--pending" aria-live="polite">
        <span className="payment-result__indicator" aria-hidden="true" />
        <p className="checkout-plan__name">Sprawdzamy płatność</p>
        <h1>Czekamy na potwierdzenie Przelewy24.</h1>
        <p>
          Nie zamykaj tej strony. Dostęp pojawi się automatycznie po
          potwierdzeniu transakcji.
        </p>
        <small>Zamówienie: {orderNumber}</small>
      </div>
    );
  }

  if (state === "timeout") {
    return (
      <div className="payment-result payment-result--pending">
        <p className="checkout-plan__name">Płatność jest przetwarzana</p>
        <h1>Potwierdzenie trwa dłużej niż zwykle.</h1>
        <p>
          Zamówienie pozostaje zapisane. Możesz sprawdzić je ponownie albo
          przejść do panelu.
        </p>
        <div className="payment-result__actions">
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              setState("checking");
              setAttempt((value) => value + 1);
            }}
          >
            Sprawdź ponownie
          </button>
          <Link href="/panel" className="button-secondary">
            Przejdź do panelu
          </Link>
        </div>
      </div>
    );
  }

  if (purchase?.status === "paid") {
    return (
      <div className="payment-result payment-result--success">
        <p className="checkout-plan__name">Płatność potwierdzona</p>
        <h1>Kurs jest już dostępny na Twoim koncie.</h1>
        <p>
          Zakup: <strong>{purchase.courseTitle}</strong>. Możesz od razu przejść
          do materiałów.
        </p>
        <div className="payment-result__actions">
          <Link href="/panel" className="button-primary">
            Otwórz panel kursów
          </Link>
          <Link href="/kursy" className="button-secondary">
            Zobacz pozostałe kursy
          </Link>
        </div>
      </div>
    );
  }

  const statusMessage =
    purchase?.status === "refunded"
      ? "Płatność została zwrócona."
      : purchase?.status === "expired"
        ? "Sesja płatności wygasła."
        : "Płatność nie została ukończona.";

  return (
    <div className="payment-result payment-result--error">
      <p className="checkout-plan__name">Brak potwierdzenia</p>
      <h1>{state === "error" ? "Nie możemy sprawdzić zamówienia." : statusMessage}</h1>
      <p>
        Nie nadaliśmy dostępu i nie oznaczyliśmy zamówienia jako opłacone.
        Możesz wrócić do zakupu albo sprawdzić panel później.
      </p>
      <div className="payment-result__actions">
        <Link href="/kup" className="button-primary">
          Wróć do zakupu
        </Link>
        <Link href="/panel" className="button-secondary">
          Przejdź do panelu
        </Link>
      </div>
    </div>
  );
}
