import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/content/site";

const stats = [
  { value: "1:1", label: "konsultacje i trening zdrowia" },
  { value: "VOD", label: "kursy wideo za dostępem" },
  { value: "Gdynia", label: "gabinet i praca online" },
];

export function Hero() {
  return (
    <section className="section hero-section overflow-hidden">
      <div className="container-main grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative z-10">
          <span className="eyebrow eyebrow-large">
            Gabinet, edukacja i kursy wideo o ruchu
          </span>

          <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
            Pracuj z ciałem świadomie, nie tylko wtedy, gdy boli.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            {siteConfig.heroDescription}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={siteConfig.coursesUrl} className="button-primary">
              Zobacz kursy
            </Link>

            <Link href={siteConfig.bookingUrl} className="button-secondary">
              Umów konsultację
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
              Nowy model pracy
            </p>
            <p className="mt-3 text-lg font-semibold leading-7">
              Indywidualna pomoc, kursy tematyczne i biblioteka wiedzy w jednym miejscu.
            </p>
          </div>

          <div className="hero-badge hero-badge--bottom">
            <p className="text-xs font-bold uppercase text-[var(--accent)]">
              Dostęp za paywallem
            </p>
            <p className="mt-3 text-lg font-semibold leading-7">
              Lekcje wideo, moduły i zadania tylko dla osób z aktywnym dostępem.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
