"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

type WeightLossReportFormState = {
  email: string;
  fullName: string;
  nutritionBestWorst: string;
  caloriesMaintained: string;
  snacking: string;
  eatingHoursMaintained: string;
  dietDeviations: string;
  hungerLevel: string;
  appetiteAttacks: string;
  waterIntake: string;
  alcohol: string;
  weeklyWeight: string;
  waistCircumference: string;
};

const initialForm: WeightLossReportFormState = {
  email: "",
  fullName: "",
  nutritionBestWorst: "",
  caloriesMaintained: "",
  snacking: "",
  eatingHoursMaintained: "",
  dietDeviations: "",
  hungerLevel: "",
  appetiteAttacks: "",
  waterIntake: "",
  alcohol: "",
  weeklyWeight: "",
  waistCircumference: "",
};

const scaleOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));
const yesNoMaybeOptions = ["Tak", "Nie", "Może"];
const yesNoOptions = ["Tak", "Nie"];
const noYesMaybeOptions = ["Nie", "Tak", "Może"];

export function WeightLossReportForm() {
  const [form, setForm] = useState(initialForm);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");

  function updateField(
    field: keyof WeightLossReportFormState,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setStatus("Wysyłanie raportu...");

    try {
      const response = await fetch("/api/reports/weight-loss", {
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

      <Field label="Co w Twoim żywieniu poszło najlepiej? Co najgorzej?">
        <textarea
          value={form.nutritionBestWorst}
          onChange={(event) => updateField("nutritionBestWorst", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Czy utrzymałeś/aś odpowiednią kaloryczność diety?"
        name="caloriesMaintained"
        options={yesNoMaybeOptions}
        value={form.caloriesMaintained}
        onChange={(event) => updateField("caloriesMaintained", event)}
      />

      <RadioGroup
        label="Czy podjadałeś/aś między posiłkami?"
        name="snacking"
        options={yesNoOptions}
        value={form.snacking}
        onChange={(event) => updateField("snacking", event)}
      />

      <RadioGroup
        label="Czy utrzymałeś/aś zalecane godziny jedzenia (ostatni posiłek, przerwy między posiłkami)?"
        name="eatingHoursMaintained"
        options={noYesMaybeOptions}
        value={form.eatingHoursMaintained}
        onChange={(event) => updateField("eatingHoursMaintained", event)}
      />

      <RadioGroup
        label="Liczba odstępstw od diety."
        name="dietDeviations"
        options={scaleOptions}
        value={form.dietDeviations}
        onChange={(event) => updateField("dietDeviations", event)}
      />

      <RadioGroup
        label="Poziom głodu w skali 1-10."
        name="hungerLevel"
        options={scaleOptions}
        value={form.hungerLevel}
        onChange={(event) => updateField("hungerLevel", event)}
      />

      <Field label="Napady apetytu (kiedy i jak często).">
        <textarea
          value={form.appetiteAttacks}
          onChange={(event) => updateField("appetiteAttacks", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Ile wody wypijałeś/aś dziennie?">
        <input
          value={form.waterIntake}
          onChange={(event) => updateField("waterIntake", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Czy alkohol był spożywany w tym tygodniu? Jeśli tak, ile razy?">
        <input
          value={form.alcohol}
          onChange={(event) => updateField("alcohol", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Waga tygodniowa.">
        <input
          value={form.weeklyWeight}
          onChange={(event) => updateField("weeklyWeight", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Obwód pasa.">
        <input
          value={form.waistCircumference}
          onChange={(event) => updateField("waistCircumference", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
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
  name: keyof WeightLossReportFormState;
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
