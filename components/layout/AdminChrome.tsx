import Link from "next/link";
import { landingFonts } from "@/components/sections/landing-fonts";
import styles from "./admin-pages.module.css";

export function AdminHeader() {
  return (
    <header className={`${styles.header} ${landingFonts}`}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand}>
          FILIP PRONIEWICZ<small>LEKARZ · TRENER ZDROWIA</small>
        </Link>
        <nav aria-label="Menu administratora" className={styles.headerNav}>
          <Link href="/">Zobacz stronę ↗</Link>
          <Link href="/panel">Moje konto</Link>
          <form action="/api/auth/logout" method="post">
            <button type="submit">Wyloguj →</button>
          </form>
        </nav>
      </div>
    </header>
  );
}

export function AdminFooter() {
  return (
    <footer className={`${styles.footer} ${landingFonts}`}>
      <span>FILIP PRONIEWICZ · PANEL ADMINISTRATORA</span>
      <Link href="/">Przejdź do strony ↗</Link>
    </footer>
  );
}
