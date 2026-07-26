"use client";

import { useEffect, useRef, useState } from "react";

type TurnstileFieldProps = {
  siteKey: string;
  requireTurnstile?: boolean;
  onVerify: (token: string) => void;
  onExpire?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileField({
  siteKey,
  requireTurnstile = true,
  onVerify,
  onExpire,
}: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const [scriptReady, setScriptReady] = useState(
    typeof window !== "undefined" && Boolean(window.turnstile)
  );
  const [widgetError, setWidgetError] = useState(false);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onExpire, onVerify]);

  useEffect(() => {
    if (!siteKey || window.turnstile) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (window.turnstile) {
        setScriptReady(true);
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [siteKey]);

  useEffect(() => {
    if (!requireTurnstile || !siteKey || scriptReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setWidgetError(true);
    }, 8000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [requireTurnstile, scriptReady, siteKey]);

  useEffect(() => {
    if (
      !requireTurnstile ||
      !siteKey ||
      !scriptReady ||
      !window.turnstile ||
      !containerRef.current
    ) {
      return;
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          setWidgetError(false);
          onVerifyRef.current(token);
        },
        "expired-callback": () => {
          onExpireRef.current?.();
        },
        "error-callback": () => {
          setWidgetError(true);
          onExpireRef.current?.();
        },
      });
    } catch {
      window.setTimeout(() => {
        setWidgetError(true);
      }, 0);
      return;
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [requireTurnstile, scriptReady, siteKey]);

  if (!requireTurnstile) {
    return null;
  }

  if (!siteKey) {
    return (
      <p className="text-sm font-semibold text-red-700">
        Zabezpieczenie formularza nie zostalo poprawnie skonfigurowane na serwerze.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      <div ref={containerRef} />
      {widgetError ? (
        <p className="text-sm font-semibold text-red-700">
          Nie udalo sie zaladowac zabezpieczenia formularza. Najczesciej powoduje to
          blokada skryptow w przegladarce albo brak poprawnie dodanej domeny w Cloudflare Turnstile.
        </p>
      ) : null}
      <p className="text-sm text-[var(--muted)]">
        Zabezpieczenie formularza chroni przed automatycznym spamem.
      </p>
    </div>
  );
}
