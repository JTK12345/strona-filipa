import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nie znaleziono strony | Świadomy Profil Ciała",
  description: "Ten adres nie istnieje albo strona została przeniesiona.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <section className="error-page">
      <div className="container-main">
        <div className="error-page__content">
          <span className="eyebrow">404</span>
          <h1>Nie znaleziono strony</h1>
          <p>
            Wygląda na to, że ten adres nie istnieje albo strona została
            przeniesiona.
          </p>
          <div className="error-page__actions">
            <Link href="/" className="button-primary">
              Wróć na stronę główną
            </Link>
            <Link href="/#uslugi" className="button-secondary">
              Zobacz usługi
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
