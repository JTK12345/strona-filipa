"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/errors/ErrorScreen";
import styles from "@/components/errors/error-screen.module.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Global application error.", error);
  }, [error]);
  return (
    <html lang="pl">
      <head>
        <title>Chwilowa przerwa | Filip Proniewicz</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className={styles.document}>
        <main>
          <ErrorScreen
            code="500"
            title="Potrzebujemy chwili."
            description="Nie udało się wyświetlić strony. Spróbuj ponownie za chwilę lub wróć na stronę główną."
            onRetry={unstable_retry}
          />
        </main>
      </body>
    </html>
  );
}
