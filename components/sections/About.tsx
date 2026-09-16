import styles from "./landing.module.css";
export function About() {
  return (
    <section id="o-mnie" className={styles.section}>
      <div className={`${styles.wrap} ${styles.about}`}>
        <div>
          <span className={styles.eyebrow}>O mnie</span>
          <h2 className={styles.title}>
            Nie szukam tylko miejsca bólu. Szukam przyczyny.
          </h2>
        </div>
        <div className={styles.aboutCopy}>
          <p>
            Nazywam się Filip Proniewicz. Jestem lekarzem i trenerem zdrowia.
            Łączę wiedzę medycyny rodzinnej z praktyką trenerską oraz medycyną
            stylu życia, aby pomagać pacjentom odzyskać sprawność, zapobiegać
            chorobom i starzeć się w zdrowiu.
          </p>
          <p>
            <strong>
              Moim celem nie jest dawanie przypadkowych zaleceń, lecz stworzenie
              planu, który da się realnie wdrożyć w codziennym życiu.
            </strong>
          </p>
          <div className={styles.stats}>
            <div>
              <b>1:1</b>
              <span>Indywidualne podejście</span>
            </div>
            <div>
              <b>360°</b>
              <span>Spojrzenie na zdrowie</span>
            </div>
            <div>
              <b>PLAN</b>
              <span>Do wdrożenia w życiu</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
