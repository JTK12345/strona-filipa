"use client";

import { useEffect, useRef, useState } from "react";

type TurnstileFieldProps = {
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

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function TurnstileField({ onVerify, onExpire }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const [scriptReady, setScriptReady] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onExpire, onVerify]);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ) {
      setShouldRender(false);
      return;
    }

    if (!turnstileSiteKey || window.turnstile) {
      setScriptReady(Boolean(window.turnstile));
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptReady(true), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => setScriptReady(true), { once: true });
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (
      !shouldRender ||
      !turnstileSiteKey ||
      !scriptReady ||
      !window.turnstile ||
      !containerRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token) => {
        onVerifyRef.current(token);
      },
      "expired-callback": () => {
        onExpireRef.current?.();
      },
      "error-callback": () => {
        onExpireRef.current?.();
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, shouldRender]);

  if (!turnstileSiteKey || !shouldRender) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <div ref={containerRef} />
      <p className="text-sm text-[var(--muted)]">
        Zabezpieczenie formularza chroni przed automatycznym spamem.
      </p>
    </div>
  );
}
