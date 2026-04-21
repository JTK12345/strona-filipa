"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";
import { formConfig } from "@/content/form-config";

type AppointmentFormState = {
  name: string;
  phone: string;
  email: string;
  preferredContactTime: string;
  message: string;
  csrfToken: string;
  website: string;
};

const initialForm: AppointmentFormState = {
  name: "",
  phone: "",
  email: "",
  preferredContactTime: "",
  message: "",
  csrfToken: "",
  website: "",
};

export function AppointmentForm() {
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
    field: keyof AppointmentFormState,
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
    setStatus("Wysylanie zgloszenia...");

    try {
      const response = await fetch("/api/appointment", {
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
        setStatus("Zgloszenie zostalo wyslane. Odezwiemy sie, aby ustalic termin.");
        return;
      }

      setStatus(data?.error ?? "Nie udalo sie wyslac zgloszenia.");
    } catch {
      setStatus("Nie udalo sie wyslac zgloszenia.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-10 grid gap-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-4 text-sm leading-6 text-[var(--muted)]">
        <p>Prosimy nie wpisywac informacji o stanie zdrowia w formularzu.</p>
        <p className="mt-2">
          Nie wpisuj w formularzu informacji o stanie zdrowia. Szczegoly omowimy
          podczas kontaktu telefonicznego lub na wizycie.
        </p>
      </div>

      <Field
        label={formConfig.appointmentNameLabel}
        required={formConfig.appointmentNameRequired}
      >
        <input
          value={form.name}
          onChange={(event) => updateField("name", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required={formConfig.appointmentNameRequired}
          autoComplete="name"
          maxLength={80}
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Telefon" required={false}>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event)}
            className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
            inputMode="tel"
            autoComplete="tel"
            maxLength={32}
          />
        </Field>

        <Field label="E-mail" required={false}>
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event)}
            className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
            autoComplete="email"
            maxLength={160}
          />
        </Field>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Podaj przynajmniej numer telefonu lub adres e-mail.
      </p>

      <Field label="Preferowany termin lub pora kontaktu">
        <textarea
          value={form.preferredContactTime}
          onChange={(event) => updateField("preferredContactTime", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          placeholder="Np. poniedzialek po 17:00, sroda 10:00-14:00, kontakt rano"
          required
          maxLength={200}
        />
      </Field>

      <Field label="Krotka wiadomosc" required={false}>
        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          placeholder="Opcjonalnie: kilka slow o celu kontaktu lub preferowanej formie odpowiedzi"
          maxLength={1000}
        />
      </Field>

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

      <div>
        <button className="button-primary" disabled={isSending || isConfigLoading}>
          {isSending ? "Wysylanie..." : "Wyslij prosbe o kontakt"}
        </button>
        <p className="mt-4 text-sm font-semibold text-[var(--muted)]" aria-live="polite">
          {status}
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  required = true,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-semibold">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
