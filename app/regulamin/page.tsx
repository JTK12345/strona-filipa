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
        <span className="legal-draft">Projekt przed uruchomieniem sprzedaży</span>
        <h1>Regulamin platformy i sprzedaży kursów</h1>
        <p>
          Ten dokument jest miejscem na finalny regulamin. Przed włączeniem
          płatności musi zostać uzupełniony o dane sprzedawcy, zasady zawarcia
          umowy, dostarczania treści cyfrowych, reklamacji, odstąpienia od umowy
          oraz wymagania techniczne.
        </p>
        <h2>Zakres dostępu</h2>
        <p>
          Zakup dotyczy wybranego kursu i przypisanych do niego lekcji wideo,
          notatek oraz materiałów. Szczegółowy czas dostępu i warunki korzystania
          zostaną wskazane w finalnym regulaminie.
        </p>
        <h2>Płatność i aktywacja</h2>
        <p>
          Płatność będzie obsługiwana przez Przelewy24. Dostęp zostaje aktywowany
          dopiero po potwierdzeniu prawidłowej płatności przez operatora.
        </p>
      </div>
    </section>
  );
}
