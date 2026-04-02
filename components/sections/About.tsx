export function About() {
  return (
    <section id="o-mnie" className="section">
      <div className="container-main grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card-surface min-h-[420px] bg-[linear-gradient(180deg,#dceae4_0%,#eef5f1_100%)] p-8">
          <div className="flex h-full flex-col justify-end">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              Filip Proniewicz
            </p>
            <p className="mt-4 text-2xl font-semibold leading-snug">
              Trener zdrowia, terapeuta manualny, trener personalny, student VI roku medycyny.
            </p>
          </div>
        </div>

        <div>
          <span className="eyebrow">O specjaliście</span>
          <h2 className="section-title">
            Praca nad zdrowiem nie kończy się na jednym zabiegu.
          </h2>
          <div className="space-y-5 text-[1.02rem] leading-8 text-[var(--muted)]">
            <p>
              W swojej pracy Filip łączy medycynę, ruch, terapię manualną, psychologię motywacji
              i uważność, bo człowiek nie jest zbiorem narządów, ale systemem, w którym wszystko
              wpływa na wszystko.
            </p>
            <p>
              Celem współpracy jest nie tylko zmniejszenie bólu czy napięcia, ale przywracanie
              sprawności poprzez świadomy ruch, edukację, profilaktykę i zrozumienie przyczyn problemu.
            </p>
            <p>
              To podejście dla osób, które chcą naprawdę coś zmienić i są gotowe pracować nad sobą
              również poza gabinetem.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="card-surface p-5">
              <p className="font-semibold">Indywidualne podejście</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Każdy plan dopasowany do osoby, nie do szablonu.</p>
            </div>
            <div className="card-surface p-5">
              <p className="font-semibold">Autoterapia</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Narzędzia, które dają realną niezależność poza wizytą.</p>
            </div>
            <div className="card-surface p-5">
              <p className="font-semibold">Praca nad przyczyną</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Ruch, oddech, regeneracja i nawyki jako jeden proces.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}