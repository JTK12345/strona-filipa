"use client";

import Link from "next/link";
import { useEffect } from "react";

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
      <body
        style={{
          margin: 0,
          background: "#f7f5ef",
          color: "#20251f",
          fontFamily:
            '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
          }}
        >
          <section style={{ maxWidth: "680px" }}>
            <p
              style={{
                display: "inline-block",
                margin: "0 0 1rem",
                borderRadius: "999px",
                background: "#edf2e8",
                color: "#2f5d50",
                padding: "0.42rem 0.85rem",
                fontSize: "0.88rem",
                fontWeight: 700,
              }}
            >
              Błąd
            </p>
            <h1
              style={{
                margin: 0,
                maxWidth: "620px",
                fontSize: "clamp(2.2rem, 7vw, 4rem)",
                lineHeight: 1.04,
                fontWeight: 900,
              }}
            >
              Coś poszło nie tak
            </h1>
            <p
              style={{
                margin: "1rem 0 0",
                maxWidth: "620px",
                color: "#667064",
                fontSize: "1.05rem",
                lineHeight: 1.75,
              }}
            >
              Nie udało się poprawnie wyświetlić tej strony. Spróbuj ponownie
              lub wróć na stronę główną.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => unstable_retry()}
                style={{
                  border: 0,
                  borderRadius: "8px",
                  background: "#2f5d50",
                  color: "#ffffff",
                  padding: "0.95rem 1.4rem",
                  font: "inherit",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Spróbuj ponownie
              </button>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #d9ddd4",
                  borderRadius: "8px",
                  color: "#20251f",
                  padding: "0.95rem 1.4rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Wróć na stronę główną
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
