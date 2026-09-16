import Link from "next/link";
import { siteConfig } from "@/content/site";
import styles from "./landing.module.css";
const ways = [
  {
    title: "Umów analizę zdrowia",
    description:
      "Szeroka konsultacja dotycząca objawów, badań, stylu życia i profilaktyki.",
    href: siteConfig.bookingUrl,
  },
  {
    title: "Biblioteka zaleceń lekarza",
    description:
      "Materiały wideo, ćwiczenia i zalecenia do samodzielnej pracy.",
    href: siteConfig.libraryUrl,
  },
  {
    title: "Akademia zdrowia",
    description:
      "Kursy i programy dotyczące profilaktyki, ruchu i zdrowych nawyków.",
    href: siteConfig.coursesUrl,
  },
];
export function HelpWays() {
  return (
    <section className={`${styles.section} ${styles.ways}`}>
      <div className={styles.wrap}>
        <div className={styles.headingRow}>
          <div>
            <span className={styles.eyebrow}>Jak mogę pomóc</span>
            <h2 className={styles.title}>
              Zdrowie to proces,
              <br />
              nie jednorazowa porada.
            </h2>
          </div>
          <p>
            Wybierz formę wsparcia odpowiadającą temu, czego potrzebujesz dziś —
            od analizy po samodzielną pracę.
          </p>
        </div>
        <div className={styles.wayGrid}>
          {ways.map((way, index) => (
            <Link href={way.href} key={way.href} className={styles.way}>
              <span className={styles.eyebrow}>0{index + 1}</span>
              <h3>{way.title}</h3>
              <p>{way.description}</p>
              <span className={styles.wayArrow} aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
