import { contactData } from "@/content/contact";
import { ContactForm } from "@/components/ContactForm";

export function ContactCTA() {
  return (
    <section id="kontakt" className="section">
      <div className="container-main">
        <div className="soft-panel rounded-[2rem] border border-[var(--border)] p-8 md:p-12">
          <span className="inline-block rounded-full bg-[var(--soft)] px-3 py-1 text-sm font-semibold text-[var(--accent)]">
            Masz pytanie?
          </span>

          <h2 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Napisz, jesli chcesz szybko uzyskac odpowiedz.
          </h2>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Zostaw krotka wiadomosc, jesli chcesz zapytac o wspolprace, dojazd,
            dostepnosc terminow albo organizacje pierwszej wizyty.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a href={contactData.instagramUrl} className="button-secondary">
              Napisz na Instagramie
            </a>
          </div>

          <div className="mt-10 section-divider" />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Telefon</p>
              <p className="mt-2 text-lg font-semibold">{contactData.phone}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Adres</p>
              <p className="mt-2 text-lg font-semibold">{contactData.address}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Instagram</p>
              <p className="mt-2 text-lg font-semibold">@swiadomy_profil_ciala</p>
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </section>
  );
}
