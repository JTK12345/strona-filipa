import { faqItems } from "@/content/faq";
import styles from "./landing.module.css";
export function FAQ() {
  return (
    <section id="faq" className={styles.section}>
      <div className={`${styles.wrap} ${styles.faq}`}>
        <div>
          <span className={styles.eyebrow}>Pytania i odpowiedzi</span>
          <h2 className={styles.title}>Wszystko jasno.</h2>
        </div>
        <div className={styles.faqList}>
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
