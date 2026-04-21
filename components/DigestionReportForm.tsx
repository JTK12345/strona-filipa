"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

type DigestionReportFormState = {
  email: string;
  fullName: string;
  symptomsReduced: string;
  bowelMovements: string;
  bristolScale: string;
  bloating: string;
  abdominalPain: string;
  reflux: string;
  digestionQuality: string;
  intolerances: string;
  stoolOrUrineChanges: string;
  supplements: string;
};

const initialForm: DigestionReportFormState = {
  email: "",
  fullName: "",
  symptomsReduced: "",
  bowelMovements: "",
  bristolScale: "",
  bloating: "",
  abdominalPain: "",
  reflux: "",
  digestionQuality: "",
  intolerances: "",
  stoolOrUrineChanges: "",
  supplements: "",
};

const symptomsReducedOptions = ["Nie", "Tak", "Może"];
const digestionQualityOptions = ["Bardzo dobrze", "Dobrze", "Średnio", "Kiepsko"];

export function DigestionReportForm() {
  const [form, setForm] = useState(initialForm);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");

  function updateField(
    field: keyof DigestionReportFormState,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (process.env.NODE_ENV === "production" && !turnstileToken) {
      setStatus("Najpierw potwierdz zabezpieczenie antyspamowe formularza.");
      return;
    }

    setIsSending(true);
    setStatus("Wysyłanie raportu...");

    try {
      const response = await fetch("/api/reports/digestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, turnstileToken }),
      });

      if (response.ok) {
        setForm(initialForm);
        setTurnstileToken("");
        setStatus("Raport został wysłany. Dziękujemy za dokładne odpowiedzi.");
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      setStatus(data?.error ?? "Nie udało się wysłać raportu.");
    } catch {
      setStatus("Nie udało się wysłać raportu.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 grid gap-6">
      <Field label="Adres e-mail">
        <input
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Imię i nazwisko">
        <input
          value={form.fullName}
          onChange={(event) => updateField("fullName", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Czy zmniejszyły się objawy związane z układem pokarmowym?"
        name="symptomsReduced"
        options={symptomsReducedOptions}
        value={form.symptomsReduced}
        onChange={(event) => updateField("symptomsReduced", event)}
      />

      <Field label="Ilość wypróżnień na dobę.">
        <input
          value={form.bowelMovements}
          onChange={(event) => updateField("bowelMovements", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Konsystencja (skala Bristol).">
        <input
          value={form.bristolScale}
          onChange={(event) => updateField("bristolScale", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Wzdęcia (tak/nie + godzina).">
        <textarea
          value={form.bloating}
          onChange={(event) => updateField("bloating", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Ból brzucha (lokalizacja + skala 1-10).">
        <textarea
          value={form.abdominalPain}
          onChange={(event) => updateField("abdominalPain", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Refluks (kiedy, po czym).">
        <textarea
          value={form.reflux}
          onChange={(event) => updateField("reflux", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Jakość trawienia po 3 głównych posiłkach."
        name="digestionQuality"
        options={digestionQualityOptions}
        value={form.digestionQuality}
        onChange={(event) => updateField("digestionQuality", event)}
      />

      <Field label="Nietolerancje / reakcje po konkretnych produktach.">
        <textarea
          value={form.intolerances}
          onChange={(event) => updateField("intolerances", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Czy stolec lub mocz miały niepokojące zmiany (kolor, zapach, pienienie)?">
        <textarea
          value={form.stoolOrUrineChanges}
          onChange={(event) => updateField("stoolOrUrineChanges", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Ile pozostało suplementów? Czy wystarczy na kolejny tydzień?">
        <textarea
          value={form.supplements}
          onChange={(event) => updateField("supplements", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <TurnstileField
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken("")}
      />

      <div>
        <button className="button-primary" disabled={isSending}>
          {isSending ? "Wysyłanie..." : "Wyślij raport"}
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-semibold">
        {label} <span aria-hidden="true">*</span>
      </span>
      {children}
    </label>
  );
}

function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: keyof DigestionReportFormState;
  options: string[];
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="font-semibold">
        {label} <span aria-hidden="true">*</span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-3"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
              required
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
