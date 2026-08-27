import Image from "next/image";

export function About() {
  return (
    <section id="o-mnie" className="section">
      <div className="container-main grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="about-panel">
          <Image
            src="/files/filip-portrait.png"
            alt="Filip Proniewicz, lekarz i terapeuta manualny"
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 38vw"
          />
          <div className="about-panel__caption">
            <p>Filip Proniewicz</p>
            <span>
              Lekarz · terapeuta manualny · trener zdrowia · trener personalny
            </span>
          </div>
        </div>

        <div>
          <span className="eyebrow">O specjaliście</span>
          <h2 className="section-title">
            Szeroka analiza problemu, nie tylko miejsca bólu.
          </h2>
          <div className="space-y-5 text-[1.02rem] leading-8 text-[var(--muted)]">
            <p>
              Filip łączy wiedzę lekarską, terapię manualną, ocenę
              funkcjonalną i trening zdrowia. Dzięki temu patrzy na problem
              szerzej: przez objawy, ruch, obciążenia, styl życia i możliwości
              pacjenta.
            </p>
            <p>
              W praktyce oznacza to spokojny wywiad, ocenę ruchu, pracę
              manualną tam, gdzie ma sens, oraz jasny plan ćwiczeń lub zmian do
              wdrożenia po spotkaniu.
            </p>
            <p>
              Ważną częścią współpracy jest edukacja pacjenta: zrozumienie, co
              może podtrzymywać dolegliwości i jak wracać do aktywności bez
              przypadkowych, oderwanych od siebie zaleceń.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="card-surface p-5">
              <p className="font-semibold">Medyczne myślenie</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Bez obietnic na skróty i bez ignorowania czerwonych flag.</p>
            </div>
            <div className="card-surface p-5">
              <p className="font-semibold">Praktyka ruchowa</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Ćwiczenia i rutyny dobrane do realnego życia.</p>
            </div>
            <div className="card-surface p-5">
              <p className="font-semibold">Materiały do pracy własnej</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Materiały wideo jako przedłużenie procesu pracy.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
