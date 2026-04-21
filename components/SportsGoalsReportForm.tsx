"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

type SportsGoalsReportFormState = {
  email: string;
  fullName: string;
  trainingUnits: string;
  intensity: string;
  fatigue: string;
  jointsReaction: string;
  techniqueImproved: string;
  complementaryExercises: string;
  bestTrainingPart: string;
};

const initialForm: SportsGoalsReportFormState = {
  email: "",
  fullName: "",
  trainingUnits: "",
  intensity: "",
  fatigue: "",
  jointsReaction: "",
  techniqueImproved: "",
  complementaryExercises: "",
  bestTrainingPart: "",
};

const scaleOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));
const jointsReactionOptions = [
  "Odczułem/am ból",
  "Bez bólu",
  "Chwilowy dyskomfort",
];
const yesNoMaybeOptions = ["Tak", "Nie", "Może"];
const noYesMaybeOptions = ["Nie", "Tak", "Może"];

export function SportsGoalsReportForm() {
  const [form, setForm] = useState(initialForm);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");

  function updateField(
    field: keyof SportsGoalsReportFormState,
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
      const response = await fetch("/api/reports/sports-goals", {
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

      <Field label="Ile jednostek treningowych wykonałeś/aś? Jakich?">
        <textarea
          value={form.trainingUnits}
          onChange={(event) => updateField("trainingUnits", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Ocena intensywności (1-10)."
        name="intensity"
        options={scaleOptions}
        value={form.intensity}
        onChange={(event) => updateField("intensity", event)}
      />

      <RadioGroup
        label="Zmęczenie powysiłkowe (1-10)."
        name="fatigue"
        options={scaleOptions}
        value={form.fatigue}
        onChange={(event) => updateField("fatigue", event)}
      />

      <RadioGroup
        label="Jak reagowały stawy?"
        name="jointsReaction"
        options={jointsReactionOptions}
        value={form.jointsReaction}
        onChange={(event) => updateField("jointsReaction", event)}
      />

      <RadioGroup
        label="Czy technika konkretnego ruchu się poprawiła?"
        name="techniqueImproved"
        options={yesNoMaybeOptions}
        value={form.techniqueImproved}
        onChange={(event) => updateField("techniqueImproved", event)}
      />

      <RadioGroup
        label="Czy wykonałeś/aś ćwiczenia uzupełniające (mobilność/oddech)?"
        name="complementaryExercises"
        options={noYesMaybeOptions}
        value={form.complementaryExercises}
        onChange={(event) => updateField("complementaryExercises", event)}
      />

      <Field label="Co było najlepsze w treningach?">
        <textarea
          value={form.bestTrainingPart}
          onChange={(event) => updateField("bestTrainingPart", event)}
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
  name: keyof SportsGoalsReportFormState;
  options: string[];
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="font-semibold">
        {label} <span aria-hidden="true">*</span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-5">
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
