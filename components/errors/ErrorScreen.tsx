import { landingFonts } from "@/components/sections/landing-fonts";
import styles from "./error-screen.module.css";

export function ErrorScreen({
  code,
  title,
  description,
  onRetry,
}: {
  code: string;
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <section className={`${styles.screen} ${landingFonts}`}>
      <div className={styles.panel}>
        <span className={styles.eyebrow}>
          {code === "404" ? "404 · Nie znaleziono strony" : "Chwilowa przerwa"}
        </span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          {onRetry && (
            <button type="button" onClick={onRetry} className={styles.primary}>
              Spróbuj ponownie <span aria-hidden="true">↻</span>
            </button>
          )}
          {/* A full document navigation also recovers a broken root layout. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className={onRetry ? styles.secondary : styles.primary}>
            Wróć na stronę główną <span aria-hidden="true">→</span>
          </a>
          {!onRetry && (
            <a href="/umow-konsultacje" className={styles.secondary}>
              Umów analizę zdrowia
            </a>
          )}
        </div>
        <span className={styles.code} aria-hidden="true">
          {code}
        </span>
      </div>
    </section>
  );
}
