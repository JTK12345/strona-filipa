export function About() {
  return (
    <section id="o-mnie" className="section">
      <div className="container-main grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="about-panel">
          <div>
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
            Profesjonalna edukacja ma wspierać wizyty, nie udawać diagnozy.
          </h2>
          <div className="space-y-5 text-[1.02rem] leading-8 text-[var(--muted)]">
            <p>
              Świadomy Profil Ciała łączy pracę gabinetową, ruch, terapię manualną
              i edukację. Nowa część kursowa ma uporządkować wiedzę tak, żeby pacjent
              lub klient mógł wracać do materiałów również poza spotkaniem.
            </p>
            <p>
              Kursy nie zastępują indywidualnej konsultacji w sytuacjach wymagających
              diagnostyki. Mają pomagać w profilaktyce, budowaniu świadomości ruchu
              i utrzymaniu efektów pracy.
            </p>
            <p>
              Celem pozostaje samodzielność: lepsze rozumienie ciała, spokojniejszy
              powrót do aktywności i mniej przypadkowe podejście do ćwiczeń.
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
              <p className="font-semibold">Edukacja premium</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Materiały wideo jako przedłużenie procesu pracy.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
