import Link from "next/link";
import { HashScrollLink } from "@/components/HashScrollLink";
import { siteConfig } from "@/content/site";

const shortcuts = [
  {
    title: "Praca z bólem",
    description: "Poznaj podejście i wybierz formę współpracy.",
    action: "Poznaj usługę",
    href: "/#uslugi",
  },
  {
    title: "Konsultacja online",
    description: "Rozmowa i plan działania z dowolnego miejsca.",
    action: "Sprawdź konsultację online",
    href: "/umow-konsultacje#online",
  },
  {
    title: "Wizyta w Gdyni",
    description: "Ocena ruchu i indywidualna praca w gabinecie.",
    action: "Sprawdź wizytę w gabinecie",
    href: "/umow-konsultacje#gdynia",
  },
];

export function Hero() {
  return (
    <section className="hero-section overflow-hidden">
      <div className="container-main relative z-10">
        <span className="eyebrow hero-name">Filip Proniewicz</span>
        <p className="hero-credentials">
          Lekarz · terapeuta manualny · trener zdrowia · trener personalny
        </p>
        <h1 className="hero-title">
          Świadoma praca z bólem, napięciem i ruchem.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)] md:text-lg">
          {siteConfig.heroDescription}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={siteConfig.bookingUrl} className="button-primary">
            Umów konsultację
          </Link>
          <HashScrollLink href="/#uslugi" className="button-secondary">
            Poznaj usługę
          </HashScrollLink>
        </div>
        <div className="hero-shortcuts">
          {shortcuts.map((item) => (
            <HashScrollLink key={item.href} href={item.href} className="hero-shortcut">
              <span className="hero-shortcut__title">{item.title}</span>
              <span className="hero-shortcut__description">{item.description}</span>
              <span className="hero-shortcut__action">
                <span>{item.action}</span><span aria-hidden="true">↗</span>
              </span>
            </HashScrollLink>
          ))}
        </div>
      </div>
    </section>
  );
}
