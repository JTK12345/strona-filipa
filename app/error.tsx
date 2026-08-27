"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Application route error.", error);
  }, [error]);

  return (
    <section className="error-page">
      <div className="container-main">
        <div className="error-page__content">
          <span className="eyebrow">Błąd</span>
          <h1>Coś poszło nie tak</h1>
          <p>
            Nie udało się poprawnie wyświetlić tej strony. Spróbuj ponownie lub
            wróć na stronę główną.
          </p>
          <div className="error-page__actions">
            <button
              type="button"
              className="button-primary"
              onClick={() => unstable_retry()}
            >
              Spróbuj ponownie
            </button>
            <Link href="/" className="button-secondary">
              Wróć na stronę główną
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
