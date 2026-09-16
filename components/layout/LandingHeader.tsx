"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/content/site";
import styles from "@/components/sections/landing.module.css";

export function LandingHeader({
  loggedIn,
  isAdmin,
  fontClass,
}: {
  loggedIn: boolean;
  isAdmin: boolean;
  fontClass: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  return (
    <header className={`${styles.theme} ${fontClass} ${styles.header}`}>
      <div className={`${styles.wrap} ${styles.headerInner}`}>
        <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
          FILIP PRONIEWICZ<small>LEKARZ · TRENER ZDROWIA</small>
        </Link>
        <button
          ref={toggle}
          type="button"
          className={styles.menuToggle}
          aria-expanded={open}
          aria-controls="landing-navigation"
          aria-label={open ? "Zamknij menu" : "Otwórz menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? "✕" : "☰"}
        </button>
        <nav
          id="landing-navigation"
          aria-label="Menu główne"
          className={`${styles.navigation} ${open ? styles.navigationOpen : ""}`}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <Link href="/#o-mnie">O mnie</Link>
          <Link href="/#uslugi">Współpraca</Link>
          <Link href="/#akademia">Akademia zdrowia</Link>
          <Link href="/#faq">FAQ</Link>
          {loggedIn && <Link href="/panel">Moje kursy</Link>}
          {isAdmin && <Link href="/panel/admin">Admin</Link>}
          {loggedIn ? (
            <form action="/api/auth/logout" method="post">
              <button className={styles.logout} type="submit">
                Wyloguj
              </button>
            </form>
          ) : (
            <Link href="/logowanie">Logowanie</Link>
          )}
          <Link href={siteConfig.bookingUrl} className={styles.button}>
            Umów analizę <b aria-hidden="true">→</b>
          </Link>
        </nav>
      </div>
    </header>
  );
}
