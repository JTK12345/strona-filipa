"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

type PainRehabReportFormState = {
  email: string;
  fullName: string;
  painLocation: string;
  painIntensity: string;
  painTriggers: string;
  painRelief: string;
  rehabExercisesDone: string;
  mobilityProgress: string;
  exerciseCount: string;
  trainingReaction: string;
  rangeOfMotionImproved: string;
  movementDiscomfort: string;
  movementControlImproved: string;
};

const initialForm: PainRehabReportFormState = {
  email: "",
  fullName: "",
  painLocation: "",
  painIntensity: "",
  painTriggers: "",
  painRelief: "",
  rehabExercisesDone: "",
  mobilityProgress: "",
  exerciseCount: "",
  trainingReaction: "",
  rangeOfMotionImproved: "",
  movementDiscomfort: "",
  movementControlImproved: "",
};

const scaleOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));
const yesNoOptions = ["Tak", "Nie"];
const yesNoMaybeOptions = ["Tak", "Nie", "Może"];
const trainingReactionOptions = ["Poprawa", "Pogorszenie", "Bez zmian"];

export function PainRehabReportForm() {
  const [form, setForm] = useState(initialForm);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");

  function updateField(
    field: keyof PainRehabReportFormState,
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
      const response = await fetch("/api/reports/pain-rehab", {
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

      <Field label="Czy wystąpił gdzieś ból? Jeśli tak to gdzie?">
        <textarea
          value={form.painLocation}
          onChange={(event) => updateField("painLocation", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Intensywność bólu (0-10)."
        name="painIntensity"
        options={scaleOptions}
        value={form.painIntensity}
        onChange={(event) => updateField("painIntensity", event)}
      />

      <Field label="Co wywoływało ból?">
        <textarea
          value={form.painTriggers}
          onChange={(event) => updateField("painTriggers", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
        />
      </Field>

      <Field label="Czy coś zmniejszyło ból?">
        <textarea
          value={form.painRelief}
          onChange={(event) => updateField("painRelief", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
        />
      </Field>

      <RadioGroup
        label="Czy wykonałeś/aś zalecane ćwiczenia rehabilitacyjne?"
        name="rehabExercisesDone"
        options={yesNoOptions}
        value={form.rehabExercisesDone}
        onChange={(event) => updateField("rehabExercisesDone", event)}
      />

      <RadioGroup
        label="Postęp w mobilności (1-10)."
        name="mobilityProgress"
        options={scaleOptions}
        value={form.mobilityProgress}
        onChange={(event) => updateField("mobilityProgress", event)}
      />

      <Field label="Ile razy?">
        <input
          value={form.exerciseCount}
          onChange={(event) => updateField("exerciseCount", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Reakcja na trening"
        name="trainingReaction"
        options={trainingReactionOptions}
        value={form.trainingReaction}
        onChange={(event) => updateField("trainingReaction", event)}
      />

      <RadioGroup
        label="Czy zakres ruchu w problematycznych miejscach się poprawił?"
        name="rangeOfMotionImproved"
        options={yesNoMaybeOptions}
        value={form.rangeOfMotionImproved}
        onChange={(event) => updateField("rangeOfMotionImproved", event)}
      />

      <RadioGroup
        label="Czy któryś ruch powodował dyskomfort?"
        name="movementDiscomfort"
        options={yesNoOptions}
        value={form.movementDiscomfort}
        onChange={(event) => updateField("movementDiscomfort", event)}
      />

      <RadioGroup
        label="Czy czujesz większą kontrolę i świadomość ruchu?"
        name="movementControlImproved"
        options={yesNoMaybeOptions}
        value={form.movementControlImproved}
        onChange={(event) => updateField("movementControlImproved", event)}
      />

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
      <span className="font-semibold">{label}</span>
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
  name: keyof PainRehabReportFormState;
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
