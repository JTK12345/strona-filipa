import { siteConfig } from "@/content/site";

export function Hero() {
  return (
    <section className="section">
      <div className="container-main grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* LEWA STRONA */}
        <div>
          <span className="eyebrow">
            Gdynia • gabinet • holistyczna praca z ciałem
          </span>

          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
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

          {/* highlighty */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {siteConfig.heroHighlights.map((item) => (
              <div key={item.title} className="card-surface p-5">
                <p className="text-sm font-semibold text-[var(--accent)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PRAWA STRONA — PREMIUM KARTA */}
        <div className="soft-panel p-4">
          <div className="flex min-h-[480px] flex-col justify-end rounded-[1.25rem] p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
              ŚWIADOMY PROFIL CIAŁA
            </p>

            <p className="mt-4 max-w-md text-2xl font-semibold leading-snug">
              Medycyna, ruch, terapia manualna i edukacja połączone w jeden
              proces pracy nad zdrowiem.
            </p>

            {/* delikatna linia jak w PDF */}
            <div className="mt-6 h-[1px] w-full bg-[var(--border)]" />

            <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
              Praca oparta na zrozumieniu przyczyn problemu, a nie tylko
              redukcji objawów.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}