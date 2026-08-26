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

        <div className="appointment-contact-panel">
          <div className="appointment-copy">
            <span className="eyebrow">Konsultacja</span>
            <h1>Umów konsultację</h1>
            <p>
              Zadzwoń, napisz e-mail lub skontaktuj się przez Instagram. W
              pierwszej wiadomości wystarczy krótko napisać, czego dotyczy
              kontakt.
            </p>
          </div>

          <div className="appointment-contact-list">
            <section>
              <span>Telefon</span>
              <strong>{contactData.phone}</strong>
              <a href={`tel:${contactData.phoneRaw}`} className="button-primary">
                Zadzwoń
              </a>
            </section>

            <section>
              <span>E-mail</span>
              <strong>{contactData.email}</strong>
              <a href={`mailto:${contactData.email}`} className="button-secondary">
                Napisz e-mail
              </a>
            </section>

            <section>
              <span>Instagram</span>
              <strong>@swiadomy_profil_ciala</strong>
              <a href={contactData.instagramUrl} className="button-secondary">
                Napisz na Instagramie
              </a>
            </section>

            <section className="appointment-office">
              <span>Gabinet</span>
              <strong>{contactData.address}</strong>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
