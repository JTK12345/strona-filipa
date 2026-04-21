"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

type WeeklyBasicReportFormState = {
  email: string;
  fullName: string;
  nameAndPeriod: string;
  recommendationsScore: string;
  energyScore: string;
  trainingUnits: string;
  complementaryTraining: string;
  sleepScore: string;
  nutritionScore: string;
  stressScore: string;
  averageSteps: string;
  closerToGoal: string;
  biggestSuccess: string;
  biggestDifficulty: string;
  needsChange: string;
};

const initialForm: WeeklyBasicReportFormState = {
  email: "",
  fullName: "",
  nameAndPeriod: "",
  recommendationsScore: "",
  energyScore: "",
  trainingUnits: "",
  complementaryTraining: "",
  sleepScore: "",
  nutritionScore: "",
  stressScore: "",
  averageSteps: "",
  closerToGoal: "",
  biggestSuccess: "",
  biggestDifficulty: "",
  needsChange: "",
};

const scaleOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));
const yesNoOptions = ["Tak", "Nie"];
const yesNoMaybeOptions = ["Tak", "Nie", "Może"];
const noYesOptions = ["Nie", "Tak"];

export function WeeklyBasicReportForm() {
  const [form, setForm] = useState(initialForm);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");

  function updateField(
    field: keyof WeeklyBasicReportFormState,
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
      const response = await fetch("/api/reports/weekly-basic", {
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

      <Field label="Okres składania raportu (np. 01-07.10)">
        <input
          value={form.nameAndPeriod}
          onChange={(event) => updateField("nameAndPeriod", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Jak oceniasz realizację zaleceń w tym tygodniu? (1 - wcale, 10 - w 100%)"
        name="recommendationsScore"
        options={scaleOptions}
        value={form.recommendationsScore}
        onChange={(event) => updateField("recommendationsScore", event)}
      />

      <RadioGroup
        label="Jak wyglądała Twoja średnia energia w ciągu dnia? (1 - bardzo niska, 10 - wysoka)"
        name="energyScore"
        options={scaleOptions}
        value={form.energyScore}
        onChange={(event) => updateField("energyScore", event)}
      />

      <Field label="Ile jednostek treningowych wykonałeś/aś w tym tygodniu? Wpisz liczbę i opisz jakie.">
        <textarea
          value={form.trainingUnits}
          onChange={(event) => updateField("trainingUnits", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Czy wykonałeś/aś trening uzupełniający?"
        name="complementaryTraining"
        options={yesNoOptions}
        value={form.complementaryTraining}
        onChange={(event) => updateField("complementaryTraining", event)}
      />

      <RadioGroup
        label="Jak spałeś/aś w tym tygodniu? (1 - bardzo słabo, 10 - bardzo dobrze)"
        name="sleepScore"
        options={scaleOptions}
        value={form.sleepScore}
        onChange={(event) => updateField("sleepScore", event)}
      />

      <RadioGroup
        label="Jak wyglądała Twoja jakość żywienia w tym tygodniu? (1 - dużo odstępstw, 10 - zgodnie z zaleceniami)"
        name="nutritionScore"
        options={scaleOptions}
        value={form.nutritionScore}
        onChange={(event) => updateField("nutritionScore", event)}
      />

      <RadioGroup
        label="Jak wyglądał poziom stresu? (1 - niski, 10 - bardzo wysoki)"
        name="stressScore"
        options={scaleOptions}
        value={form.stressScore}
        onChange={(event) => updateField("stressScore", event)}
      />

      <Field label="Jaką masz tygodniową dzienną średnią ilość kroków?">
        <input
          value={form.averageSteps}
          onChange={(event) => updateField("averageSteps", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Czy czujesz, że jesteś bliżej realizacji swojego głównego celu?"
        name="closerToGoal"
        options={yesNoMaybeOptions}
        value={form.closerToGoal}
        onChange={(event) => updateField("closerToGoal", event)}
      />

      <Field label="Co było Twoim największym sukcesem w tym tygodniu?">
        <textarea
          value={form.biggestSuccess}
          onChange={(event) => updateField("biggestSuccess", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Co sprawiło Ci największą trudność?">
        <textarea
          value={form.biggestDifficulty}
          onChange={(event) => updateField("biggestDifficulty", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Czy potrzebujesz jakiejś zmiany, korekty lub wyjaśnienia?"
        name="needsChange"
        options={noYesOptions}
        value={form.needsChange}
        onChange={(event) => updateField("needsChange", event)}
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
  name: keyof WeeklyBasicReportFormState;
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
