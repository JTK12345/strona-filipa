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

export function TurnstileField({ onVerify, onExpire }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const [siteKey, setSiteKey] = useState("");
  const [scriptReady, setScriptReady] = useState(
    typeof window !== "undefined" && Boolean(window.turnstile)
  );
  const [shouldRender, setShouldRender] = useState(true);
  const [configError, setConfigError] = useState(false);

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

    let cancelled = false;

    async function loadConfig() {
      try {
        const response = await fetch("/api/public-config", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("config_request_failed");
        }

        const data = (await response.json()) as {
          turnstileSiteKey?: unknown;
        };

        if (cancelled) {
          return;
        }

        const nextSiteKey =
          typeof data.turnstileSiteKey === "string" ? data.turnstileSiteKey : "";

        setSiteKey(nextSiteKey);
        setConfigError(!nextSiteKey);
      } catch {
        if (!cancelled) {
          setConfigError(true);
        }
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!siteKey || window.turnstile) {
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
  }, [siteKey]);

  useEffect(() => {
    if (
      !shouldRender ||
      !siteKey ||
      !scriptReady ||
      !window.turnstile ||
      !containerRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
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
  }, [scriptReady, shouldRender, siteKey]);

  if (!shouldRender) {
    return null;
  }

  if (configError) {
    return (
      <p className="text-sm font-semibold text-red-700">
        Zabezpieczenie formularza nie zostalo poprawnie skonfigurowane na serwerze.
      </p>
    );
  }

  if (!siteKey) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Ladowanie zabezpieczenia formularza...
      </p>
    );
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
