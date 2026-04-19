"use client";

import { type FormEvent, useState } from "react";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSending(true);
    setStatus("Wysyłanie...");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("Wysłano. Dziękujemy za wiadomość.");
        setForm({ name: "", phone: "", message: "" });
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      setStatus(data?.error ?? "Nie udało się wysłać wiadomości.");
    } catch {
      setStatus("Nie udało się wysłać wiadomości.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 grid gap-4">
      <input
        placeholder="Imię"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="p-3 border rounded"
        required
      />

      <input
        placeholder="Telefon"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="p-3 border rounded"
        required
      />

      <textarea
        placeholder="Wiadomość"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="p-3 border rounded"
        required
      />

      <button className="button-primary" disabled={isSending}>
        {isSending ? "Wysyłanie..." : "Wyślij"}
      </button>

      <p aria-live="polite">{status}</p>
    </form>
  );
}
