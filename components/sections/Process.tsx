import Image from "next/image";

const steps = [
  {
    title: "Ocena problemu",
    description:
      "Wywiad, analiza ograniczeń, stylu życia i kierunku pracy. Bez zgadywania i bez gotowych schematów dla każdego.",
  },
  {
    title: "Praktyczna praca",
    description:
      "Ćwiczenia, ruch, oddech, praca manualna lub trening zdrowia dobrane do celu i aktualnych możliwości.",
  },
  {
    title: "Autoterapia i edukacja",
    description:
      "Dostajesz proste zalecenia oraz, gdy potrzeba, materiały online po kodzie, żeby wracać do instrukcji poza spotkaniem.",
  },
  {
    title: "Plan długofalowy",
    description:
      "Ustalamy, co robić dalej: samodzielnie, w pakiecie współpracy albo przez okresową kontrolę postępów.",
  },
];

const processPhotos = [
  {
    src: "/files/filip-consultation-interview.jpg",
    alt: "Wywiad i analiza problemu podczas konsultacji",
    label: "Wywiad i analiza",
    description:
      "Rozmowa, zebranie kontekstu i ustalenie, co najbardziej wpływa na problem.",
  },
  {
    src: "/files/filip-functional-assessment.jpg",
    alt: "Ocena funkcjonalna sylwetki i postawy w gabinecie",
    label: "Ocena funkcjonalna",
    description:
      "Sprawdzenie postawy, ruchu i obciążeń zamiast patrzenia tylko na miejsce bólu.",
  },
];

export function Process() {
  return (
    <section className="section">
      <div className="container-main">
        <span className="eyebrow">Jak wygląda współpraca</span>
        <h2 className="section-title max-w-3xl">
          Prosty proces: od rozpoznania problemu do planu, który da się wdrożyć.
        </h2>
        <div className="process-timeline mt-10">
          {steps.map((step, index) => (
            <article key={step.title} className="process-card">
              <p className="text-sm font-bold text-[var(--accent)]">0{index + 1}</p>
              <h3 className="mt-4 text-xl font-bold leading-snug">{step.title}</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">{step.description}</p>
            </article>
          ))}
        </div>
        <div className="process-photo-grid">
          {processPhotos.map((photo) => (
            <figure key={photo.src} className="process-photo-card">
              <div className="process-photo-card__image">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <figcaption>
                <strong>{photo.label}</strong>
                <span>{photo.description}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
