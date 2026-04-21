"use client";

import { type FormEvent, useEffect, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

type ContactFormErrors = {
  name: boolean;
  phone: boolean;
  message: boolean;
};

const emptyErrors: ContactFormErrors = {
  name: false,
  phone: false,
  message: false,
};

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ContactFormErrors>(emptyErrors);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contactStatus = params.get("contact");

    if (contactStatus === "sent") {
      setStatus("Wyslano. Dziekujemy za wiadomosc.");
      return;
    }

    if (contactStatus === "missing") {
      setStatus("Uzupelnij wszystkie pola formularza.");
      return;
    }

    if (contactStatus === "error") {
      setStatus("Nie udalo sie wyslac wiadomosci.");
    }
  }, []);

  function validateForm() {
    const nextErrors = {
      name: !form.name.trim(),
      phone: !form.phone.trim(),
      message: !form.message.trim(),
    };

    setFieldErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateForm()) {
      setStatus("Uzupelnij wszystkie pola formularza.");
      return;
    }

    setIsSending(true);
    setStatus("Wysylanie...");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, turnstileToken }),
      });

      if (res.ok) {
        setStatus("Wyslano. Dziekujemy za wiadomosc.");
        setForm({ name: "", phone: "", message: "" });
        setTurnstileToken("");
        setFieldErrors(emptyErrors);
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      setStatus(data?.error ?? "Nie udalo sie wyslac wiadomosci.");
    } catch {
      setStatus("Nie udalo sie wyslac wiadomosci.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      action="/api/contact"
      method="post"
      noValidate
      className="mt-10 grid gap-4"
    >
      <div className="grid gap-2">
        <input
          name="name"
          type="text"
          placeholder="Imie"
          value={form.name}
          onChange={(e) => {
            setForm({ ...form, name: e.target.value });
            if (fieldErrors.name) {
              setFieldErrors((current) => ({ ...current, name: false }));
            }
          }}
          className="p-3 border rounded"
          aria-invalid={fieldErrors.name}
          required
        />
        {fieldErrors.name ? (
          <p className="text-sm font-semibold text-red-700">Podaj imie.</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <input
          name="phone"
          type="tel"
          placeholder="Telefon"
          value={form.phone}
          onChange={(e) => {
            setForm({ ...form, phone: e.target.value });
            if (fieldErrors.phone) {
              setFieldErrors((current) => ({ ...current, phone: false }));
            }
          }}
          className="p-3 border rounded"
          aria-invalid={fieldErrors.phone}
          required
        />
        {fieldErrors.phone ? (
          <p className="text-sm font-semibold text-red-700">Podaj numer telefonu.</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <textarea
          name="message"
          placeholder="Wiadomosc"
          value={form.message}
          onChange={(e) => {
            setForm({ ...form, message: e.target.value });
            if (fieldErrors.message) {
              setFieldErrors((current) => ({ ...current, message: false }));
            }
          }}
          className="p-3 border rounded"
          aria-invalid={fieldErrors.message}
          required
        />
        {fieldErrors.message ? (
          <p className="text-sm font-semibold text-red-700">Wpisz tresc wiadomosci.</p>
        ) : null}
      </div>

      <TurnstileField
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken("")}
      />
      <input type="hidden" name="turnstileToken" value={turnstileToken} />

      <button type="submit" className="button-primary" disabled={isSending}>
        {isSending ? "Wysylanie..." : "Wyslij"}
      </button>

      <p aria-live="polite" className="text-sm font-semibold text-[var(--muted)]">
        {status}
      </p>
    </form>
  );
}
