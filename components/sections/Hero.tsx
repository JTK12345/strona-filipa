import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/content/site";
import styles from "./landing.module.css";
export function Hero() {
  return (
    <>
      <section className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              Analiza zdrowia · zalecenia zdrowotne · edukacja
            </span>
            <h1>
              Żyj dłużej
              <br />
              <em>w zdrowiu.</em>
            </h1>
            <p>
              Pomagam nie tylko leczyć choroby, ale też im zapobiegać.
              Konsultacje online i stacjonarne oparte na medycynie rodzinnej,
              ruchu, śnie i żywieniu.
            </p>
            <Link href={siteConfig.bookingUrl} className={styles.button}>
              Umów analizę zdrowia <b aria-hidden="true">→</b>
            </Link>
          </div>
          <figure className={styles.person}>
            <Image
              src="/files/filip-portrait.png"
              alt="Lekarz Filip Proniewicz"
              fill
              unoptimized
              preload
              sizes="(max-width: 800px) 100vw, 45vw"
            />
            <figcaption>Lek. Filip Proniewicz</figcaption>
          </figure>
        </div>
      </section>
      <div className={styles.strip}>
        <div className={styles.wrap}>
          <strong>Lekarz · trener zdrowia · edukator zdrowotny</strong>
          <p>
            Analiza zdrowia, realny plan działania i materiały do dalszej pracy
            — w Twoim tempie.
          </p>
        </div>
      </div>
    </>
  );
}
