import { testimonials } from "@/content/testimonials";
import styles from "./landing.module.css";
export function Testimonials() {
  return (
    <section className={`${styles.section} ${styles.testimonials}`}>
      <div className={styles.wrap}>
        <span className={styles.eyebrow}>Opinie</span>
        <h2 className={styles.title}>Zaufanie buduje praktyka.</h2>
        <div className={styles.testimonialGrid}>
          {testimonials.map((testimonial, index) => (
            <figure key={`${testimonial.author}-${index}`}>
              <span className={styles.quoteMark} aria-hidden="true">
                “
              </span>
              <blockquote>{testimonial.text}</blockquote>
              <figcaption>
                <strong>{testimonial.author}</strong>
                <span>{testimonial.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
