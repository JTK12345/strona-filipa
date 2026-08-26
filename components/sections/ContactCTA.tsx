import Link from "next/link";
import { contactData } from "@/content/contact";
import { siteConfig } from "@/content/site";

export function ContactCTA() {
  return (
    <section id="kontakt" className="section">
      <div className="container-main">
        <div className="contact-hub contact-hub--split">
          <div>
            <span className="eyebrow">Kontakt</span>
            <h2 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Umów konsultację albo napisz krótką wiadomość.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Na start wystarczy wybrać termin lub napisać, z czym chcesz
              pracować. Szczegółową dokumentację zdrowotną najlepiej omawiać w
              bezpieczniejszym kontakcie po ustaleniu konsultacji.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={siteConfig.bookingUrl} className="button-primary">
                Umów konsultację
              </Link>
              <a href={`tel:${contactData.phoneRaw}`} className="button-secondary">
                Zadzwoń
              </a>
            </div>
          </div>

          <div className="contact-strip">
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
              <p className="text-sm font-semibold text-[var(--muted)]">Adres</p>
              <p className="mt-2 block text-lg font-bold">{contactData.address}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Instagram</p>
              <a className="mt-2 block text-lg font-bold" href={contactData.instagramUrl}>
                świadomy_profil_ciała
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
