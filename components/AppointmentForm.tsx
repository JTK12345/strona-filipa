"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

type AppointmentFormState = {
  fullName: string;
  phone: string;
  email: string;
  visitType: string;
  preferredDates: string;
  goal: string;
  previousClient: string;
  notes: string;
};

const initialForm: AppointmentFormState = {
  fullName: "",
  phone: "",
  email: "",
  visitType: "",
  preferredDates: "",
  goal: "",
  previousClient: "",
  notes: "",
};

const visitTypeOptions = ["Stacjonarnie", "Online", "Telefonicznie"];
const yesNoOptions = ["Tak", "Nie"];

export function AppointmentForm() {
  const [form, setForm] = useState(initialForm);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");

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
    if (process.env.NODE_ENV === "production" && !turnstileToken) {
      setStatus("Najpierw potwierdz zabezpieczenie antyspamowe formularza.");
      return;
    }

    setIsSending(true);
    setStatus("Wysyłanie zgłoszenia...");

    try {
      const response = await fetch("/api/appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, turnstileToken }),
      });

      if (response.ok) {
        setForm(initialForm);
        setTurnstileToken("");
        setStatus("Zgłoszenie zostało wysłane. Odezwiemy się z propozycją terminu.");
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      setStatus(data?.error ?? "Nie udało się wysłać zgłoszenia.");
    } catch {
      setStatus("Nie udało się wysłać zgłoszenia.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 grid gap-6">
      <Field label="Imię i nazwisko">
        <input
          value={form.fullName}
          onChange={(event) => updateField("fullName", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Telefon">
        <input
          value={form.phone}
          onChange={(event) => updateField("phone", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Adres e-mail">
        <input
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Preferowana forma konsultacji"
        name="visitType"
        options={visitTypeOptions}
        value={form.visitType}
        onChange={(event) => updateField("visitType", event)}
      />

      <Field label="W jakich dniach i godzinach możesz się spotkać?">
        <textarea
          value={form.preferredDates}
          onChange={(event) => updateField("preferredDates", event)}
          className="min-h-32 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          placeholder="Np. poniedziałek po 17:00, środa 10:00-14:00, piątek wieczorem"
          required
        />
      </Field>

      <Field label="Jaki jest główny cel konsultacji?">
        <textarea
          value={form.goal}
          onChange={(event) => updateField("goal", event)}
          className="min-h-32 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Czy jesteś już po wcześniejszej współpracy?"
        name="previousClient"
        options={yesNoOptions}
        value={form.previousClient}
        onChange={(event) => updateField("previousClient", event)}
      />

      <Field label="Dodatkowe informacje">
        <textarea
          value={form.notes}
          onChange={(event) => updateField("notes", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          placeholder="Np. dolegliwości, preferowany kontakt, ważne ograniczenia czasowe"
        />
      </Field>

      <TurnstileField
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken("")}
      />

      <div>
        <button className="button-primary" disabled={isSending}>
          {isSending ? "Wysyłanie..." : "Wyślij propozycję terminów"}
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
  name: keyof AppointmentFormState;
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
