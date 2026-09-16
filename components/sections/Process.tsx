import Image from "next/image";
import styles from "./landing.module.css";

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
      "Dostajesz proste zalecenia oraz, gdy potrzeba, materiały dla subskrybentów, żeby wracać do instrukcji poza spotkaniem.",
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
    imageClassName: "object-cover object-top",
    description:
      "Sprawdzenie postawy, ruchu i obciążeń zamiast patrzenia tylko na miejsce bólu.",
  },
];

export function Process() {
  return (
    <section className={`${styles.section} ${styles.process}`}>
      <div className={styles.wrap}>
        <span className={styles.eyebrow}>Jak wygląda współpraca</span>
        <h2 className={`${styles.title} ${styles.processTitle}`}>
          Prosty proces: od rozpoznania problemu do planu, który da się wdrożyć.
        </h2>
        <div className={styles.processRow}>
          {steps.map((step, index) => (
            <article key={step.title} className={styles.processStep}>
              <span className={styles.eyebrow}>0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
        <div className={styles.photoCards}>
          {processPhotos.map((photo) => (
            <figure key={photo.src} className={styles.photoCard}>
              <div className={styles.photoImage}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  unoptimized
                  className={photo.imageClassName ?? "object-cover"}
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
