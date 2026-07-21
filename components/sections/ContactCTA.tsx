import Link from "next/link";
import { contactData } from "@/content/contact";
import { siteConfig } from "@/content/site";

const contactOptions = [
  {
    title: "Chcę konsultację",
    description: "Najlepsze, jeśli masz konkretny problem bólowy, ograniczenie ruchu albo chcesz plan 1:1.",
    href: "/umow-konsultacje",
    label: "Zostaw kontakt",
  },
  {
    title: "Mam pytanie o kurs",
    description: "Dobre, jeśli nie wiesz, który program będzie właściwy albo chcesz zapytać o dostęp.",
    href: contactData.instagramUrl,
    label: "Napisz na Instagramie",
  },
  {
    title: "Nie wiem, co wybrać",
    description: "Krótka wiadomość wystarczy. Bez opisywania szczegółów zdrowotnych w formularzu.",
    href: `mailto:${contactData.email}`,
    label: "Wyślij e-mail",
  },
];

export function ContactCTA() {
  return (
    <section id="kontakt" className="section">
      <div className="container-main">
        <div className="contact-hub">
          <div>
            <span className="eyebrow">Kontakt</span>
            <h2 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Wybierz najkrótszą drogę kontaktu.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Formularz nie musi być pierwszym krokiem. Możesz od razu wybrać konsultację,
              zapytać o kurs albo napisać krótką wiadomość.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {contactOptions.map((option) => (
              <article key={option.title} className="contact-option">
                <h3 className="text-xl font-bold">{option.title}</h3>
                <p className="mt-3 min-h-24 leading-7 text-[var(--muted)]">{option.description}</p>
                <Link href={option.href} className="button-secondary mt-5 w-full">
                  {option.label}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-10 contact-strip">
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Telefon</p>
              <a className="mt-2 block text-lg font-bold" href={`tel:${contactData.phoneRaw}`}>
                {contactData.phone}
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">E-mail</p>
              <a className="mt-2 block text-lg font-bold" href={`mailto:${contactData.email}`}>
                {contactData.email}
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Dostęp do kursów</p>
              <Link className="mt-2 block text-lg font-bold" href={siteConfig.accessUrl}>
                Panel dostępu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
