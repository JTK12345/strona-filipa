import Link from "next/link";
import { patientForms } from "@/content/forms";

export function PatientForms() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <div className="mb-10">
          <Link className="button-back" href="/">
            <span aria-hidden="true">←</span>
            <span>Powrót</span>
          </Link>
        </div>

        <span className="eyebrow eyebrow-large">Formularze</span>
        <h2 className="section-title max-w-3xl">Formularze zalecone w trakcie współpracy.</h2>
        <p className="section-lead">
          Wybierz raport, o którego uzupełnienie poproszono Cię w trakcie współpracy.
          Im dokładniejsze odpowiedzi, tym łatwiej ocenić reakcje organizmu i dobrać
          kolejne kroki.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {patientForms.map((form) => (
            <article key={form.href} className="card-surface flex h-full flex-col p-7">
              <h3 className="text-2xl font-semibold">{form.title}</h3>
              <p className="mt-4 leading-7 text-[var(--muted)]">{form.description}</p>
              <div className="mt-auto pt-6">
                <Link className="button-primary" href={form.href}>
                  Wypełnij raport
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
