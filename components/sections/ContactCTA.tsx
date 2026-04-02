import { contactData } from "@/content/contact";

export function ContactCTA() {
  return (
    <section className="section">
      <div className="container-main">
        <div className="soft-panel rounded-[2rem] p-8 md:p-12 border border-[var(--border)]">
          
          {/* mały label */}
          <span className="inline-block rounded-full bg-[var(--soft)] px-3 py-1 text-sm font-semibold text-[var(--accent)]">
            Pierwszy krok do zmiany
          </span>

          {/* nagłówek */}
          <h2 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Masz pytania albo chcesz umówić wizytę w Gdyni?
          </h2>

          {/* opis */}
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Skontaktuj się i sprawdź, jaka forma współpracy będzie najlepsza w Twojej sytuacji.
          </p>

          {/* przyciski */}
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={`tel:${contactData.phoneRaw}`}
              className="button-primary"
            >
              Zadzwoń
            </a>

            <a
              href={contactData.instagramUrl}
              className="button-secondary"
            >
              Napisz na Instagramie
            </a>
          </div>

          {/* divider jak w PDF */}
          <div className="mt-10 section-divider" />

          {/* dane */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                Telefon
              </p>
              <p className="mt-2 text-lg font-semibold">
                {contactData.phone}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                Adres
              </p>
              <p className="mt-2 text-lg font-semibold">
                {contactData.address}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                Instagram
              </p>
              <p className="mt-2 text-lg font-semibold">
                @swiadomy_profil_ciala
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}