import { contactData } from "@/content/contact";
import { siteConfig } from "@/content/site";

export function Footer() {
  return (
    <footer id="kontakt" className="border-t border-[var(--border)] bg-white">
      <div className="container-main grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold">{siteConfig.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--muted)]">
            Holistyczna opieka nad zdrowiem w Gdyni. Ruch, terapia manualna,
            edukacja i indywidualna praca nad przyczyną problemu.
          </p>
        </div>

        <div>
          <p className="font-semibold">Kontakt</p>
          <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <p>Telefon: {contactData.phone}</p>
            <p>E-mail: {contactData.email}</p>
            <p>Adres: {contactData.address}</p>
          </div>
        </div>

        <div>
          <p className="font-semibold">Social media</p>
          <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <a className="block hover:text-[var(--foreground)]" href={contactData.instagramUrl}>
              Instagram
            </a>
           
          </div>
        </div>
      </div>
    </footer>
  );
}