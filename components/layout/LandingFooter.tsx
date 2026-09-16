import Link from "next/link";
import { contactData } from "@/content/contact";
import { siteConfig } from "@/content/site";
import { landingFonts } from "@/components/sections/landing-fonts";
import styles from "@/components/sections/landing.module.css";
export function LandingFooter({ loggedIn }: { loggedIn: boolean }) {
  return (
    <footer
      id="kontakt"
      className={`${styles.theme} ${landingFonts} ${styles.footer}`}
    >
      <div className={styles.wrap}>
        <div className={styles.footerMain}>
          <div>
            <span className={styles.eyebrow}>Zacznij od analizy zdrowia</span>
            <h2>Twój plan zdrowia może zacząć się dzisiaj.</h2>
            <a
              className={`${styles.button} ${styles.pale}`}
              href={`mailto:${contactData.email}`}
            >
              Napisz wiadomość <b aria-hidden="true">→</b>
            </a>
            <Link className={styles.footerBooking} href={siteConfig.bookingUrl}>
              Umów konsultację ↗
            </Link>
          </div>
          <div className={styles.footerLinks}>
            <strong>Filip Proniewicz</strong>
            <p>Lekarz · trener zdrowia · edukator zdrowotny</p>
            <a href={`tel:${contactData.phoneRaw}`}>{contactData.phone}</a>
            <a href={`mailto:${contactData.email}`}>{contactData.email}</a>
            <p>{contactData.address}</p>
            <a href={contactData.instagramUrl}>Instagram ↗</a>
            <Link href="/kursy">Kursy dla subskrybentów</Link>
            <Link href="/biblioteka">Biblioteka materiałów</Link>
            {loggedIn && <Link href="/panel">Panel użytkownika</Link>}
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>
            © {new Date().getFullYear()} FILIP PRONIEWICZ · {siteConfig.name}
          </p>
          <div>
            <Link href="/polityka-prywatnosci">Polityka prywatności</Link>
            <Link href="/regulamin">Regulamin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
