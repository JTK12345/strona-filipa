import type { Metadata } from "next";
import Link from "next/link";
import { AppointmentForm } from "@/components/AppointmentForm";

export const metadata: Metadata = {
  title: "Umów konsultację",
  description: "Formularz do umówienia konsultacji lub rozmowy zwrotnej.",
};

export default function AppointmentPage() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <div className="mb-10">
          <Link className="button-back" href="/#kontakt">
            <span aria-hidden="true">&larr;</span>
            <span>Powrót</span>
          </Link>
        </div>

        <div className="soft-panel p-6 md:p-10">
          <span className="eyebrow">Konsultacja</span>
          <h1 className="section-title max-w-4xl">
            Zostaw kontakt, jeśli chcesz dobrać konsultację, trening zdrowia albo kierunek pracy.
          </h1>
          <div className="section-lead grid gap-5">
            <p>
              Wypełnij krótki formularz, a odpowiedź pomoże ustalić najlepszy kolejny krok:
              wizytę, konsultację online albo materiał edukacyjny.
            </p>
            <p>
              Nie wpisuj szczegółowych informacji medycznych w formularzu. Wystarczy cel kontaktu
              i preferowana pora rozmowy.
            </p>
          </div>

          <AppointmentForm />
        </div>
      </div>
    </section>
  );
}
