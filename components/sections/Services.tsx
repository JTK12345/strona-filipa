import Link from "next/link";
import { services } from "@/content/services";
import { siteConfig } from "@/content/site";
import styles from "./landing.module.css";
export function Services() {
  return (
    <section id="uslugi" className={styles.section}>
      <div className={styles.wrap}>
        <div id="oferta" className={styles.offersHead}>
          <span className={styles.eyebrow}>Formy współpracy</span>
          <h2 className={styles.title}>Wybierz formę współpracy.</h2>
          <p>
            Analiza zdrowia, indywidualne prowadzenie i edukacja. W gabinecie
            lub online.
          </p>
        </div>
        <div className={styles.offerGrid}>
          {services.map((service) => (
            <article className={styles.offer} key={service.title}>
              <h3>{service.title}</h3>
              <div className={styles.price}>{service.price}</div>
              <p>{service.description}</p>
              <ul>
                {service.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <Link href={siteConfig.bookingUrl} className={styles.button}>
                Umów konsultację <b aria-hidden="true">→</b>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
