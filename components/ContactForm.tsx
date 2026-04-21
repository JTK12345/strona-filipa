"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

type ContactFormState = {
  name: string;
  phone: string;
  email: string;
  message: string;
  csrfToken: string;
  website: string;
};

const initialForm: ContactFormState = {
  name: "",
  phone: "",
  email: "",
  message: "",
  csrfToken: "",
  website: "",
};

export function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFormConfig() {
      try {
        const response = await fetch("/api/public-config", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("config_request_failed");
        }

        const data = (await response.json()) as {
          csrfToken?: unknown;
          turnstileSiteKey?: unknown;
        };

        if (!cancelled) {
          setForm((current) => ({
            ...current,
            csrfToken: typeof data.csrfToken === "string" ? data.csrfToken : "",
          }));
          setTurnstileSiteKey(
            typeof data.turnstileSiteKey === "string" ? data.turnstileSiteKey : ""
          );
        }
      } catch {
        if (!cancelled) {
          setStatus("Nie udalo sie przygotowac formularza. Odswiez strone i sprobuj ponownie.");
        }
      } finally {
        if (!cancelled) {
          setIsConfigLoading(false);
        }
      }
    }

    void loadFormConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(
    field: keyof ContactFormState,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.csrfToken) {
      setStatus("Sesja formularza wygasla. Odswiez strone i sprobuj ponownie.");
      return;
    }

    if (process.env.NODE_ENV === "production" && !turnstileToken) {
      setStatus("Najpierw potwierdz zabezpieczenie antyspamowe formularza.");
      return;
    }

    setIsSending(true);
    setStatus("Wysylanie...");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          turnstileToken,
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (response.ok) {
        setForm((current) => ({
          ...initialForm,
          csrfToken: current.csrfToken,
        }));
        setTurnstileToken("");
        setStatus("Wyslano. Dziekujemy za wiadomosc.");
        return;
      }

      setStatus(data?.error ?? "Nie udalo sie wyslac wiadomosci.");
    } catch {
      setStatus("Nie udalo sie wyslac wiadomosci.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-10 grid gap-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-4 text-sm leading-6 text-[var(--muted)]">
        <p>Prosimy nie wpisywac informacji o stanie zdrowia w formularzu.</p>
        <p className="mt-2">
          Nie wpisuj w formularzu informacji o stanie zdrowia. Szczegoly omowimy
          podczas kontaktu telefonicznego lub na wizycie.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="font-semibold" htmlFor="contact-name">
            Imie
          </label>
          <input
            id="contact-name"
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event)}
            className="rounded-lg border border-[var(--border)] bg-white p-3"
            autoComplete="name"
            maxLength={80}
          />
        </div>

        <div className="grid gap-2">
          <label className="font-semibold" htmlFor="contact-phone">
            Telefon
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event)}
            className="rounded-lg border border-[var(--border)] bg-white p-3"
            autoComplete="tel"
            inputMode="tel"
            maxLength={32}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="font-semibold" htmlFor="contact-email">
          E-mail
        </label>
        <input
          id="contact-email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event)}
          className="rounded-lg border border-[var(--border)] bg-white p-3"
          autoComplete="email"
          maxLength={160}
        />
      </div>

      <p className="text-sm text-[var(--muted)]">
        Podaj przynajmniej numer telefonu lub adres e-mail.
      </p>

      <div className="grid gap-2">
        <label className="font-semibold" htmlFor="contact-message">
          Krotka wiadomosc
        </label>
        <textarea
          id="contact-message"
          value={form.message}
          onChange={(event) => updateField("message", event)}
          className="min-h-32 rounded-lg border border-[var(--border)] bg-white p-3"
          required
          maxLength={1000}
        />
      </div>

      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(event) => updateField("website", event)}
        className="hidden"
        aria-hidden="true"
      />

      <TurnstileField
        siteKey={turnstileSiteKey}
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken("")}
      />

      <button type="submit" className="button-primary" disabled={isSending || isConfigLoading}>
        {isSending ? "Wysylanie..." : "Wyslij"}
      </button>

      <p aria-live="polite" className="text-sm font-semibold text-[var(--muted)]">
        {status}
      </p>
    </form>
  );
}
