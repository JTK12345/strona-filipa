const paths = [
  {
    title: "Potrzebuję pomocy z bólem",
    description:
      "Wybierz konsultację albo trening zdrowia, jeśli chcesz indywidualnej analizy i pracy nad konkretnym problemem.",
  },
  {
    title: "Chcę ćwiczyć samodzielnie",
    description:
      "Kursy wideo poprowadzą Cię przez konkretne moduły: od rozpoznania problemu po regularną rutynę.",
  },
  {
    title: "Chcę zrozumieć swoje ciało",
    description:
      "Biblioteka porządkuje tematy bólu, mobilności, regeneracji i profilaktyki w prosty system nauki.",
  },
];

export function Problems() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <span className="eyebrow">Wybierz ścieżkę</span>
        <h2 className="section-title max-w-3xl">
          Jedna marka, trzy sposoby pracy nad zdrowiem i ruchem.
        </h2>
        <p className="section-lead">
          Strona ma prowadzić użytkownika do właściwej decyzji: konsultacji, kursu albo
          edukacji. Dzięki temu nie musi od razu wiedzieć, czego dokładnie potrzebuje.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {paths.map((path, index) => (
            <article key={path.title} className="decision-card">
              <p className="decision-card__number">0{index + 1}</p>
              <h3 className="mt-5 text-2xl font-bold">{path.title}</h3>
              <p className="mt-4 leading-7 text-[var(--muted)]">{path.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
