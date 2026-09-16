"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/errors/ErrorScreen";

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
    <ErrorScreen
      code="500"
      title="Potrzebujemy chwili."
      description="Nie udało się poprawnie wyświetlić tej strony. Spróbuj ponownie lub wróć na stronę główną."
      onRetry={unstable_retry}
    />
  );
}
