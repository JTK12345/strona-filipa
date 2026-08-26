const topics = [
  "ból pleców, szyi, barków i przeciążenia",
  "napięcie po pracy siedzącej i małej ilości ruchu",
  "ograniczona mobilność i trudność z powrotem do aktywności",
  "nawyki ruchowe, oddech, regeneracja i autoterapia",
  "plan ćwiczeń po konsultacji albo treningu zdrowia",
  "edukacja, która pomaga lepiej rozumieć sygnały z ciała",
];

export function Problems() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <span className="eyebrow">Dla kogo</span>
        <h2 className="section-title max-w-3xl">
          Dla osób, które chcą odzyskać swobodę ruchu bez przypadkowych ćwiczeń.
        </h2>
        <p className="section-lead">
          Praca zaczyna się od konkretnego problemu, ale celem jest większa
          samodzielność: mniej napięcia, lepsze nawyki i spokojniejszy powrót do
          sprawności.
        </p>

        <div className="topic-grid mt-10">
          {topics.map((topic) => (
            <p key={topic} className="check-row">
              {topic}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
