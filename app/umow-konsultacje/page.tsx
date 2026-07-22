import type { Metadata } from "next";
import { AppointmentForm } from "@/components/AppointmentForm";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Umów konsultację",
  description: "Formularz do umówienia konsultacji lub rozmowy zwrotnej.",
};

export default function AppointmentPage() {
  return (
    <section className="appointment-page">
      <div className="container-main">
        <BackHomeLink />

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
            <p className="appointment-summary__label">Pierwszy kontakt</p>
            <h2>Krótko, konkretnie i bez zobowiązań.</h2>
            <ol className="appointment-summary__items">
              <li>
                <span>01</span>
                <div>
                  <strong>Wysyłasz zgłoszenie</strong>
                  <p>Podajesz tylko cel kontaktu i dogodną porę rozmowy.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Oddzwaniamy</strong>
                  <p>Ustalamy, jaka forma współpracy będzie najlepsza.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Wybierasz kolejny krok</strong>
                  <p>Decyzję o konsultacji podejmujesz dopiero po rozmowie.</p>
                </div>
              </li>
            </ol>
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
