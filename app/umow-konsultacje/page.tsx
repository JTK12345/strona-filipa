import type { Metadata } from "next";
import { BackHomeLink } from "@/components/BackHomeLink";
import { contactData } from "@/content/contact";

export const metadata: Metadata = {
  title: "Umów konsultację",
  description: "Dane kontaktowe do umówienia konsultacji lub rozmowy zwrotnej.",
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
              Umów konsultację bez formularza.
            </h1>
            <p>
              Napisz krótką wiadomość albo zadzwoń. Na start wystarczy cel
              kontaktu i preferowana pora rozmowy, bez wysyłania dokumentacji
              medycznej przez stronę.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href={`tel:${contactData.phoneRaw}`} className="button-primary">
                Zadzwoń
              </a>
              <a href={`mailto:${contactData.email}`} className="button-secondary">
                Napisz e-mail
              </a>
            </div>
          </div>

          <aside className="appointment-summary">
            <p className="appointment-summary__label">Pierwszy kontakt</p>
            <h2>Krótko, konkretnie i bez zobowiązań.</h2>
            <ol className="appointment-summary__items">
              <li>
                <span>01</span>
                <div>
                  <strong>Dzwonisz albo piszesz</strong>
                  <p>Podajesz cel kontaktu i dogodną porę rozmowy.</p>
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

        <div className="appointment-form-card appointment-contact-card">
          <div className="appointment-form-heading">
            <h2>Kontakt</h2>
            <p>
              Formularz wysyłania zgłoszeń jest wyłączony. Kontakt odbywa się
              bezpośrednio przez telefon, e-mail albo Instagram.
            </p>
          </div>
          <div className="appointment-contact-grid">
            <a href={`tel:${contactData.phoneRaw}`}>
              <span>Telefon</span>
              <strong>{contactData.phone}</strong>
            </a>
            <a href={`mailto:${contactData.email}`}>
              <span>E-mail</span>
              <strong>{contactData.email}</strong>
            </a>
            <div>
              <span>Adres</span>
              <strong>{contactData.address}</strong>
            </div>
            <a href={contactData.instagramUrl}>
              <span>Instagram</span>
              <strong>świadomy_profil_ciała</strong>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
