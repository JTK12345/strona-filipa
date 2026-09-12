import Link from "next/link";
import { getCurrentAccessSession } from "@/app/lib/access";
import { HashScrollLink } from "@/components/HashScrollLink";
import { contactData } from "@/content/contact";
import { siteConfig } from "@/content/site";

export async function Footer() {
  const session = await getCurrentAccessSession();

  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <div className="container-main grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="text-lg font-bold">{siteConfig.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--muted)]">
            Konsultacje online i stacjonarne, trening zdrowia oraz materiały
            edukacyjne wspierające świadomą pracę z ciałem.
          </p>
        </div>

        <div>
          <p className="font-semibold">Strona</p>
          <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <HashScrollLink className="block hover:text-[var(--foreground)]" href="/">
              Start
            </HashScrollLink>
            <HashScrollLink className="block hover:text-[var(--foreground)]" href="/#uslugi">
              Usługa
            </HashScrollLink>
            <Link className="block hover:text-[var(--foreground)]" href="/kursy">
              Kursy dla subskrybentów
            </Link>
            <HashScrollLink className="block hover:text-[var(--foreground)]" href="/#o-mnie">
              O mnie
            </HashScrollLink>
            <HashScrollLink className="block hover:text-[var(--foreground)]" href="/#faq">
              FAQ
            </HashScrollLink>
            <HashScrollLink className="block hover:text-[var(--foreground)]" href="/#kontakt">
              Kontakt
            </HashScrollLink>
            {session ? (
              <Link className="block hover:text-[var(--foreground)]" href="/panel">
                Panel
              </Link>
            ) : null}
            <Link className="block hover:text-[var(--foreground)]" href="/regulamin">
              Regulamin
            </Link>
            <Link
              className="block hover:text-[var(--foreground)]"
              href="/polityka-prywatnosci"
            >
              Polityka prywatności
            </Link>
          </div>
        </div>

        <div>
          <p className="font-semibold">Kontakt</p>
          <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <a className="block hover:text-[var(--foreground)]" href={`tel:${contactData.phoneRaw}`}>
              {contactData.phone}
            </a>
            <a className="block hover:text-[var(--foreground)]" href={`mailto:${contactData.email}`}>
              {contactData.email}
            </a>
            <span className="block">{contactData.address}</span>
            <a className="block hover:text-[var(--foreground)]" href={contactData.instagramUrl}>
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
