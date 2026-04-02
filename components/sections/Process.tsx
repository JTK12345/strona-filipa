const steps = [
  {
    title: "Diagnoza funkcjonalno-medyczna",
    description:
      "Dokładny wywiad, ocena ruchu i spojrzenie na organizm jako całość, a nie zbiór pojedynczych objawów.",
  },
  {
    title: "Terapia i praktyczna praca z ciałem",
    description:
      "Terapia manualna, mobilizacje, praca z oddechem i ruchem dobrane do Twojej aktualnej sytuacji.",
  },
  {
    title: "Autoterapia i edukacja",
    description:
      "Dostajesz konkretne narzędzia do samodzielnej pracy w domu, tak żeby budować niezależność.",
  },
  {
    title: "Plan długofalowy",
    description:
      "Wdrażamy nawyki dotyczące regeneracji, stresu, snu i codziennego funkcjonowania, które utrzymują efekty.",
  },
];

export function Process() {
  return (
    <section className="section">
      <div className="container-main">
        <span className="eyebrow">Jak wygląda współpraca</span>
        <h2 className="section-title max-w-3xl">
          Łączę medycynę, ruch, terapię manualną i świadomą zmianę nawyków.
        </h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.title} className="card-surface p-7">
              <p className="text-sm font-bold text-[var(--accent)]">0{index + 1}</p>
              <h3 className="mt-3 text-2xl font-semibold">{step.title}</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}