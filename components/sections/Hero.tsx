import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/content/site";

const stats = [
  { value: "1:1", label: "konsultacje online i w Gdyni" },
  { value: "Kod", label: "materiały edukacyjne po dostępie" },
  { value: "Gdynia", label: "gabinet i praca online" },
];

export function Hero() {
  return (
    <section className="section hero-section overflow-hidden">
      <div className="container-main grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative z-10">
          <span className="eyebrow eyebrow-large">
            Konsultacje, trening zdrowia i edukacja ruchowa
          </span>

          <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
            Świadoma praca z bólem, napięciem i ruchem.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            {siteConfig.heroDescription}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={siteConfig.bookingUrl} className="button-primary">
              Umów konsultację
            </Link>

            <Link href="/#uslugi" className="button-secondary">
              Zobacz usługi
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.value} className="metric-tile">
                <p className="text-2xl font-black">{item.value}</p>
                <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-stage">
          <div className="hero-stage__visual">
            <Image
              src="/files/att.qkwcZ7RfE-UeEB5BKtBv70Mk58jeU0QHRcjtRAADtcQ.jpg"
              alt="Gabinet pracy z ciałem z planszą anatomiczną"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 42vw"
            />
            <div className="hero-stage__overlay" />
          </div>

          <div className="hero-badge hero-badge--top">
            <p className="text-xs font-bold uppercase text-[var(--accent)]">
              Praca 1:1
            </p>
            <p className="mt-3 text-lg font-semibold leading-7">
              Najpierw rozpoznanie problemu, potem praktyczny plan działania.
            </p>
          </div>

          <div className="hero-badge hero-badge--bottom">
            <p className="text-xs font-bold uppercase text-[var(--accent)]">
              Materiały po kodzie
            </p>
            <p className="mt-3 text-lg font-semibold leading-7">
              Filmy i instrukcje wspierają konsultacje, treningi i pakiety.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
