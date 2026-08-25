import type { Metadata } from "next";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Regulamin | Świadomy Profil Ciała",
};

export default function TermsPage() {
  return (
    <section className="legal-page">
      <div className="container-main legal-document">
        <BackHomeLink />
        <span className="legal-draft">Projekt regulaminu platformy</span>
        <h1>Regulamin platformy kursów</h1>
        <p>
          Ten dokument jest miejscem na finalny regulamin. Przed uruchomieniem
          platformy musi zostać uzupełniony o dane administratora, zasady
          korzystania z konta, dostarczania treści cyfrowych oraz wymagania
          techniczne.
        </p>
        <h2>Zakres dostępu</h2>
        <p>
          Dostęp jest aktywowany kodem otrzymanym od administratora i obejmuje
          przypisane kursy, lekcje wideo, instrukcje, notatki oraz pliki.
          Szczegółowy czas dostępu i warunki korzystania zostaną wskazane w
          finalnym regulaminie.
        </p>
        <h2>Kod i aktywacja</h2>
        <p>
          Kod można wykorzystać po zalogowaniu na konto. Po poprawnej aktywacji
          materiały pojawiają się w panelu użytkownika i bibliotece.
        </p>
      </div>
    </section>
  );
}
