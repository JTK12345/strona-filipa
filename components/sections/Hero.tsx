import Image from "next/image";
import { siteConfig } from "@/content/site";

export function Hero() {
  return (
    <section className="section hero-section overflow-hidden">
      <div className="container-main grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="relative z-10">
          <span className="eyebrow eyebrow-large">
            Gdynia • gabinet • holistyczna praca z ciałem
          </span>

          <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
            Pomoc w bólu,
            <br />
            napięciu i powrocie
            <br />
            do sprawności.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            {siteConfig.heroDescription}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a href={siteConfig.bookingUrl} className="button-primary">
              Umów konsultację
            </a>

            <a href="#uslugi" className="button-secondary">
              Zobacz usługi
            </a>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {siteConfig.heroHighlights.map((item, index) => (
              <div
                key={item.title}
                className="card-surface hero-highlight p-5"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-sm font-semibold text-[var(--accent)]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-stage">
          <div className="hero-stage__glow" aria-hidden="true" />
          <div className="hero-stage__visual">
            <Image
              src="/files/att.qkwcZ7RfE-UeEB5BKtBv70Mk58jeU0QHRcjtRAADtcQ.jpg"
              alt="Gabinet pracy z ciałem z roślinami i planszą anatomiczną"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 46vw"
            />
            <div className="hero-stage__overlay" />
          </div>

          <div className="hero-badge hero-badge--top card-surface">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              Świadomy Profil Ciała
            </p>
            <p className="mt-3 text-lg font-semibold leading-7">
              Terapia, ruch i edukacja spięte w jeden proces odzyskiwania sprawności.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
