"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function SessionRevalidator() {
  const router = useRouter();
  const lastState = useRef<boolean | null>(null);
  const inFlight = useRef(false);

  const checkSession = useCallback(async () => {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;

    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        if (lastState.current !== false) {
          lastState.current = false;
          router.refresh();
        }
        return;
      }

      const data = (await response.json()) as { authenticated?: boolean };
      const authenticated = Boolean(data.authenticated);

      if (lastState.current !== null && lastState.current !== authenticated) {
        router.refresh();
      }

      lastState.current = authenticated;
    } catch {
      // Session refresh is only a UI sync helper. Server-side guards remain authoritative.
    } finally {
      inFlight.current = false;
    }
  }, [router]);

  useEffect(() => {
    void checkSession();

    const handleFocus = () => void checkSession();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkSession();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkSession]);

  return null;
}
