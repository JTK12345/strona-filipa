const problems = [
  "Ból pleców, karku i barków",
  "Przeciążenia od pracy siedzącej i stresu",
  "Sztywność, napięcie i ograniczenia ruchu",
  "Powrót do sprawności po urazie lub przerwie w aktywności",
  "Chęć lepszego zrozumienia swojego ciała i pracy nad nawykami",
  "Potrzeba kompleksowego podejścia zamiast samego gaszenia objawów",
];

export function Problems() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <span className="eyebrow">Dla kogo jest ta pomoc</span>
        <h2 className="section-title max-w-3xl">
          Dla osób, które chcą nie tylko zmniejszyć ból, ale realnie poprawić swoje zdrowie.
        </h2>
        <p className="section-lead">
          Ta współpraca jest dla Ciebie, jeśli chcesz zrozumieć przyczynę dolegliwości,
          pracować nad ruchem i stopniowo budować sprawność oraz lepsze codzienne funkcjonowanie.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {problems.map((problem) => (
            <div key={problem} className="card-surface p-6">
              <p className="text-base font-semibold leading-7">{problem}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}