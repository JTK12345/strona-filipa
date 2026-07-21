import type { Metadata } from "next";
import Link from "next/link";
import { AppointmentForm } from "@/components/AppointmentForm";

export const metadata: Metadata = {
  title: "Umów konsultację",
  description: "Formularz do umówienia konsultacji lub rozmowy zwrotnej.",
};

export default function AppointmentPage() {
  return (
    <section className="appointment-page">
      <div className="container-main">
        <Link className="text-link-back" href="/#kontakt">
          <span aria-hidden="true">←</span>
          <span>Wróć do kontaktu</span>
        </Link>

        <div className="appointment-shell">
          <div className="appointment-intro">
            <span className="eyebrow">Konsultacja</span>
            <h1>
              Zostaw kontakt. Dobierzemy najlepszy kolejny krok.
            </h1>
            <p>
              To może być konsultacja online, wizyta w gabinecie, trening zdrowia
              albo wskazanie właściwego materiału edukacyjnego.
            </p>
          </div>

          <aside className="appointment-summary">
            <p className="appointment-summary__label">Jak to działa</p>
            <div className="appointment-summary__items">
              <p>1. Wysyłasz krótkie zgłoszenie.</p>
              <p>2. Ustalamy najlepszą formę kontaktu.</p>
              <p>3. Dopiero w rozmowie omawiamy szczegóły.</p>
            </div>
          </aside>
        </div>

        <div className="appointment-form-card">
          <div className="appointment-form-heading">
            <h2>Dane do kontaktu</h2>
            <p>
              Nie wpisuj szczegółowych informacji medycznych. Wystarczy cel kontaktu
              i preferowana pora rozmowy.
            </p>
          </div>
          <AppointmentForm />
        </div>
      </div>
    </section>
  );
}
