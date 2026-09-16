import type { Metadata } from "next";
import Image from "next/image";
import { BackHomeLink } from "@/components/BackHomeLink";
import { contactData } from "@/content/contact";
import { services } from "@/content/services";

export const metadata: Metadata = {
  title: "Umów konsultację",
  description: "Dane kontaktowe do umówienia konsultacji lub rozmowy zwrotnej.",
};

const statusMessages: Record<string, string> = {
  sent: "Zgłoszenie zostało wysłane. Odpowiedź przyjdzie na podany kontakt.",
  invalid: "Sprawdź formularz i spróbuj ponownie.",
  name: "Wpisz imię lub krótką nazwę kontaktu.",
  email: "Wpisz poprawny adres e-mail.",
  phone: "Wpisz poprawny numer telefonu albo zostaw to pole puste.",
  message: "Wiadomość musi mieć minimum 3 znaki.",
  rate: "Wysłano zbyt wiele zgłoszeń. Odczekaj kilka minut.",
  server:
    "Nie udało się zapisać zgłoszenia. Spróbuj ponownie albo napisz bezpośrednio.",
};

const consultationOptions = services.slice(0, 2).map((service) => ({
  ...service,
  id: service.title.includes("online") ? "online" : "gdynia",
  cta: service.title.includes("online") ? "Umów online" : "Umów wizytę",
}));

export default async function AppointmentPage(
  props: PageProps<"/umow-konsultacje">,
) {
  const searchParams = await props.searchParams;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : "";
  const statusMessage = statusMessages[status];

  return (
    <section className="appointment-page">
      <div className="container-main">
        <BackHomeLink />

        <div className="appointment-hero">
          <div className="appointment-copy">
            <span className="eyebrow">Zacznij od analizy zdrowia</span>
            <h1>
              Twój pierwszy krok
              <br />
              do lepszego zdrowia.
            </h1>
            <p>
              Wybierz formę spotkania, która pasuje do Twojej sytuacji. Jeśli
              nie wiesz, od czego zacząć, napisz krótko, z czym się zgłaszasz.
            </p>
          </div>
        </div>

        <div className="appointment-options">
          {consultationOptions.map((option) => (
            <article
              key={option.title}
              id={option.id}
              className="appointment-option-card"
            >
              <div>
                <h2>{option.title}</h2>
                <p className="appointment-price">{option.price}</p>
                <p>{option.description}</p>
              </div>
              <ul>
                {option.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              {option.title.includes("stacjonarna") ? (
                <p className="appointment-option-address">
                  {contactData.address}
                </p>
              ) : null}
              <a href="#formularz" className="button-primary">
                {option.cta}
              </a>
            </article>
          ))}
        </div>

        <div className="appointment-contact-panel">
          <div className="appointment-form-panel" id="formularz">
            <form
              action="/api/appointment"
              method="post"
              className="appointment-form"
            >
              <div>
                <span className="eyebrow">Krótka wiadomość</span>
                <h2>Napisz, czego potrzebujesz</h2>
                <p>
                  Zostaw kontakt i opisz w kilku zdaniach problem albo cel.
                  Odpowiedź pomoże dobrać właściwą formę spotkania.
                </p>
              </div>
              {statusMessage ? (
                status === "sent" ? (
                  <div className="appointment-success" role="status">
                    <strong>Zgłoszenie wysłane</strong>
                    <p>{statusMessage}</p>
                  </div>
                ) : (
                  <p className="auth-error" role="alert">
                    {statusMessage}
                  </p>
                )
              ) : null}
              <label>
                <span>Imię</span>
                <input
                  name="name"
                  required
                  maxLength={120}
                  autoComplete="name"
                />
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
          </div>

          <div className="appointment-contact-list">
            <section>
              <span>Telefon</span>
              <strong>{contactData.phone}</strong>
              <a
                href={`tel:${contactData.phoneRaw}`}
                className="button-secondary"
              >
                Zadzwoń
              </a>
            </section>

            <section>
              <span>E-mail</span>
              <strong>{contactData.email}</strong>
              <a
                href={`mailto:${contactData.email}`}
                className="button-secondary"
              >
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
              <div className="appointment-office__image">
                <Image
                  src="/files/att.qkwcZ7RfE-UeEB5BKtBv70Mk58jeU0QHRcjtRAADtcQ.jpg"
                  alt="Gabinet pracy z ciałem z planszą anatomiczną"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 360px"
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
