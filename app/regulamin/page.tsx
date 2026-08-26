import type { Metadata } from "next";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Regulamin | Świadomy Profil Ciała",
};

// TODO(production): uzupelnic dane dzialalnosci, NIP, adres i date wejscia w zycie.
export default function TermsPage() {
  return (
    <section className="legal-page">
      <div className="container-main legal-document">
        <BackHomeLink />
        <span className="legal-draft">Ostatnia aktualizacja: [DATA WEJŚCIA W ŻYCIE]</span>
        <h1>Regulamin serwisu Świadomy Profil Ciała</h1>
        <p>
          Regulamin określa zasady korzystania ze strony, konta użytkownika,
          kodów dostępu oraz materiałów edukacyjnych udostępnianych przez
          Świadomy Profil Ciała.
        </p>
        <h2>Usługodawca</h2>
        <p>
          Usługodawcą jest Filip Proniewicz, działający pod przyszłą lub
          właściwą nazwą: [PEŁNA NAZWA DZIAŁALNOŚCI FILIPA PRONIEWICZA],
          NIP: [NIP], adres: [ADRES DZIAŁALNOŚCI]. Dane należy uzupełnić przed
          produkcyjnym użyciem regulaminu.
        </p>
        <h2>Zakres usług</h2>
        <p>
          Strona służy do prezentacji usług: konsultacji online, konsultacji
          stacjonarnych, treningu zdrowia, indywidualnej pracy ruchowej,
          pakietów współpracy oraz edukacyjnych materiałów online. Materiały
          online są obecnie udostępniane bez płatności, jako wsparcie pracy
          konsultacyjnej, treningowej lub edukacyjnej.
        </p>
        <h2>Konto i kod dostępu</h2>
        <p>
          Użytkownik może utworzyć konto, zalogować się i aktywować kod
          otrzymany od administratora. Kod może dawać dostęp do całej platformy,
          biblioteki albo konkretnego kursu. Dostęp nie jest bezterminową
          sprzedażą treści i może zostać ograniczony czasowo, cofnięty w razie
          nadużyć albo zmieniony przez administratora. Jeżeli nie wskazano
          inaczej, materiały pozostają dostępne przez okres ich utrzymywania w
          Serwisie.
        </p>
        <h2>Materiały edukacyjne</h2>
        <p>
          Materiały, filmy, instrukcje i pliki mają charakter edukacyjny. Nie
          zastępują indywidualnej konsultacji, diagnostyki medycznej ani
          leczenia. W razie ostrych objawów, urazu, pogorszenia stanu zdrowia
          albo wątpliwości należy skorzystać z indywidualnej pomocy
          specjalisty.
        </p>
        <h2>Konsultacje i trening zdrowia</h2>
        <p>
          Szczegóły konsultacji, treningu zdrowia, pakietu współpracy, terminu,
          miejsca, ceny i sposobu przygotowania są ustalane indywidualnie przed
          rozpoczęciem współpracy. Użytkownik powinien przekazywać prawdziwe
          informacje potrzebne do bezpiecznego dopasowania pracy.
        </p>
        <h2>Prawa autorskie</h2>
        <p>
          Wszystkie materiały dostępne w serwisie są chronione prawem autorskim.
          Użytkownik może korzystać z nich wyłącznie na własne potrzeby. Nie
          wolno ich kopiować, publikować, odsprzedawać, udostępniać osobom
          trzecim ani wykorzystywać komercyjnie bez zgody usługodawcy.
        </p>
        <h2>Reklamacje i kontakt</h2>
        <p>
          Sprawy techniczne, pytania dotyczące dostępu oraz reklamacje można
          zgłaszać na adres e-mail: kontakt@swiadomyprofilciala.pl. Zgłoszenie
          powinno zawierać opis problemu i adres e-mail konta, którego dotyczy.
        </p>
        <h2>Zmiany regulaminu</h2>
        <p>
          Regulamin może być aktualizowany, zwłaszcza przy zmianie zakresu usług,
          danych działalności albo sposobu udostępniania materiałów. Nowa wersja
          będzie publikowana na tej stronie.
        </p>
      </div>
    </section>
  );
}
