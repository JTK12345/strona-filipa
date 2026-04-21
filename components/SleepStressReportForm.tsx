"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

type SleepStressReportFormState = {
  email: string;
  fullName: string;
  sleepHours: string;
  wakeUps: string;
  fallingAsleepTime: string;
  fallingAsleepDifficulty: string;
  morningFeeling: string;
  stressLevel: string;
  stressAffectedEatingOrSleep: string;
  relaxationTechniques: string;
  motivation: string;
  mood: string;
  concentrationImproved: string;
  libidoImproved: string;
};

const initialForm: SleepStressReportFormState = {
  email: "",
  fullName: "",
  sleepHours: "",
  wakeUps: "",
  fallingAsleepTime: "",
  fallingAsleepDifficulty: "",
  morningFeeling: "",
  stressLevel: "",
  stressAffectedEatingOrSleep: "",
  relaxationTechniques: "",
  motivation: "",
  mood: "",
  concentrationImproved: "",
  libidoImproved: "",
};

const scaleOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));
const yesNoMaybeOptions = ["Tak", "Nie", "Może"];

export function SleepStressReportForm() {
  const [form, setForm] = useState(initialForm);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");

  function updateField(
    field: keyof SleepStressReportFormState,
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
      const response = await fetch("/api/reports/sleep-stress", {
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

      <Field label="Godziny snu (od-do).">
        <input
          value={form.sleepHours}
          onChange={(event) => updateField("sleepHours", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Liczba pobudek w nocy.">
        <input
          value={form.wakeUps}
          onChange={(event) => updateField("wakeUps", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Czas zasypiania.">
        <input
          value={form.fallingAsleepTime}
          onChange={(event) => updateField("fallingAsleepTime", event)}
          className="w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <Field label="Czy zasypianie było łatwe czy trudne?">
        <textarea
          value={form.fallingAsleepDifficulty}
          onChange={(event) => updateField("fallingAsleepDifficulty", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Jakość porannego samopoczucia. (1-10)"
        name="morningFeeling"
        options={scaleOptions}
        value={form.morningFeeling}
        onChange={(event) => updateField("morningFeeling", event)}
      />

      <RadioGroup
        label="Jaki poziom stresu czułeś/aś przez większość tygodnia? (1-10)"
        name="stressLevel"
        options={scaleOptions}
        value={form.stressLevel}
        onChange={(event) => updateField("stressLevel", event)}
      />

      <RadioGroup
        label="Czy zauważyłeś/aś, że stres wpłynął na jedzenie lub sen?"
        name="stressAffectedEatingOrSleep"
        options={yesNoMaybeOptions}
        value={form.stressAffectedEatingOrSleep}
        onChange={(event) => updateField("stressAffectedEatingOrSleep", event)}
      />

      <Field label="Czy stosowałeś/aś techniki obniżania napięcia (oddech, spacer, przerwy)? TAK/NIE Jakie?">
        <textarea
          value={form.relaxationTechniques}
          onChange={(event) => updateField("relaxationTechniques", event)}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-white p-3"
          required
        />
      </Field>

      <RadioGroup
        label="Czy Twoja motywacja do działania była wysoka czy niska? (1-10)"
        name="motivation"
        options={scaleOptions}
        value={form.motivation}
        onChange={(event) => updateField("motivation", event)}
      />

      <RadioGroup
        label="Jaki był ogólny nastrój przez tydzień? (1-10)"
        name="mood"
        options={scaleOptions}
        value={form.mood}
        onChange={(event) => updateField("mood", event)}
      />

      <RadioGroup
        label="Czy poprawiła się koncentracja i jasność umysłu?"
        name="concentrationImproved"
        options={yesNoMaybeOptions}
        value={form.concentrationImproved}
        onChange={(event) => updateField("concentrationImproved", event)}
      />

      <RadioGroup
        label="Czy zauważyłeś/aś poprawę libido?"
        name="libidoImproved"
        options={yesNoMaybeOptions}
        value={form.libidoImproved}
        onChange={(event) => updateField("libidoImproved", event)}
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
  name: keyof SleepStressReportFormState;
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
