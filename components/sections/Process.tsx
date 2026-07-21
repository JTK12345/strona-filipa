const steps = [
  {
    title: "Diagnoza i kierunek",
    description:
      "Najpierw ustalamy, czy lepsza będzie praca 1:1, kurs tematyczny, czy spokojne wejście przez bibliotekę materiałów.",
  },
  {
    title: "Plan lub program",
    description:
      "Dostajesz konkretną strukturę: konsultację z zaleceniami albo kurs podzielony na moduły, lekcje i zadania.",
  },
  {
    title: "Praktyka w tygodniu",
    description:
      "Najważniejsza część dzieje się między spotkaniami i lekcjami: krótkie rutyny, kontrola napięcia i świadomy ruch.",
  },
  {
    title: "Długofalowa zmiana",
    description:
      "Celem jest nie tylko ulga, ale lepsze rozumienie ciała, mniej nawrotów i większa samodzielność.",
  },
];

export function Process() {
  return (
    <section className="section">
      <div className="container-main">
        <span className="eyebrow">Jak działa system</span>
        <h2 className="section-title max-w-3xl">
          Od pojedynczej konsultacji do pełnej ścieżki edukacyjnej.
        </h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.title} className="process-card">
              <p className="text-sm font-bold text-[var(--accent)]">0{index + 1}</p>
              <h3 className="mt-4 text-xl font-bold leading-snug">{step.title}</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
