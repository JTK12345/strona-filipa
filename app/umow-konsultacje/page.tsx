import type { Metadata } from "next";
import { BackHomeLink } from "@/components/BackHomeLink";
import { contactData } from "@/content/contact";

export const metadata: Metadata = {
  title: "Umów konsultację",
  description: "Dane kontaktowe do umówienia konsultacji lub rozmowy zwrotnej.",
};

const statusMessages: Record<string, string> = {
  sent: "Zgłoszenie zostało zapisane. Odpowiem na podany kontakt.",
  invalid: "Uzupełnij imię, poprawny e-mail i krótką wiadomość.",
  rate: "Wysłano zbyt wiele zgłoszeń. Odczekaj kilka minut.",
  server: "Nie udało się zapisać zgłoszenia. Spróbuj ponownie albo napisz bezpośrednio.",
};

export default async function AppointmentPage(
  props: PageProps<"/umow-konsultacje">,
) {
  const searchParams = await props.searchParams;
  const status = typeof searchParams.status === "string" ? searchParams.status : "";
  const statusMessage = statusMessages[status];

  return (
    <section className="appointment-page">
      <div className="container-main">
        <BackHomeLink />

        <div className="appointment-contact-panel">
          <div className="appointment-copy">
            <span className="eyebrow">Konsultacja</span>
            <h1>Umów konsultację</h1>
            <p>
              Wyślij krótkie zgłoszenie albo skorzystaj z bezpośredniego
              kontaktu. Zgłoszenie trafi do panelu administratora.
            </p>
          </div>

          <div className="appointment-contact-list">
            <form
              action="/api/appointment"
              method="post"
              className="appointment-form"
            >
              <div>
                <span className="eyebrow">Zgłoszenie</span>
                <h2>Napisz, czego potrzebujesz</h2>
              </div>
              {statusMessage ? (
                <p className={status === "sent" ? "auth-notice" : "auth-error"}>
                  {statusMessage}
                </p>
              ) : null}
              <label>
                <span>Imię</span>
                <input name="name" required maxLength={120} autoComplete="name" />
              </label>
              <label>
                <span>E-mail</span>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                />
              </label>
              <label>
                <span>Telefon</span>
                <input name="phone" maxLength={40} autoComplete="tel" />
              </label>
              <label>
                <span>Temat</span>
                <input
                  name="topic"
                  maxLength={160}
                  placeholder="np. ból pleców, konsultacja online"
                />
              </label>
              <label>
                <span>Wiadomość</span>
                <textarea
                  name="message"
                  rows={6}
                  required
                  maxLength={3000}
                  placeholder="Napisz krótko, z czym chcesz pracować."
                />
              </label>
              <button type="submit" className="button-primary">
                Wyślij zgłoszenie
              </button>
            </form>

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
