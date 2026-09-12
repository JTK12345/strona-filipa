import Image from "next/image";

export function About() {
  return (
    <section id="o-mnie" className="section about-section">
      <div className="container-main grid items-start gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="about-panel order-2 lg:order-1">
          <Image
            src="/files/filip-portrait.png"
            alt="Filip Proniewicz, lekarz i terapeuta manualny"
            fill
            unoptimized
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 38vw"
          />
          <div className="about-panel__caption">
            <p>Filip Proniewicz</p>
            <span>
              Lekarz · terapeuta manualny · trener zdrowia · trener personalny
            </span>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <span className="eyebrow">O mnie</span>
          <h2 className="section-title">
            Szeroka analiza problemu, nie tylko miejsca bólu.
          </h2>
          <div className="space-y-5 text-[1.02rem] leading-8 text-[var(--muted)]">
            <p>
              Nazywam się Filip Proniewicz. Łączę wiedzę lekarską, terapię
              manualną i trening, aby pomagać w świadomej pracy z bólem i
              napięciem. Patrzę na objawy, ruch i codzienne nawyki, a plan
              działania dopasowuję do Twoich potrzeb i możliwości.
            </p>
            <p>
              W praktyce oznacza to konkretny wywiad, ocenę funkcjonalną,
              pracę manualną tam, gdzie ma sens, oraz plan ćwiczeń lub zmian,
              który można realnie wdrożyć po spotkaniu.
            </p>
            <p>
              Ważna jest też edukacja pacjenta: zrozumienie mechanizmu
              dolegliwości, sygnałów ostrzegawczych i sposobu powrotu do
              aktywności bez przypadkowych, oderwanych od siebie zaleceń.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="card-surface p-5">
              <p className="font-semibold">Medyczne podejście</p>
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
