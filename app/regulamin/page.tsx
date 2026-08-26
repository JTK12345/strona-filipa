import type { Metadata } from "next";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Regulamin | Świadomy Profil Ciała",
};

// TODO: przed produkcją uzupełnić dane działalności.
export default function TermsPage() {
  return (
    <section className="legal-page">
      <div className="container-main legal-document">
        <BackHomeLink />
        <span className="legal-draft">Ostatnia aktualizacja: [DATA WEJŚCIA W ŻYCIE]</span>
        <h1>Regulamin serwisu Świadomy Profil Ciała</h1>
        <p>
          Regulamin określa zasady korzystania ze strony, konta użytkownika,
          kodów dostępu oraz materiałów edukacyjnych udostępnianych w Serwisie
          Świadomy Profil Ciała.
        </p>

        <h2>Usługodawca</h2>
        <p>
          Usługodawcą jest Filip Proniewicz, działający pod nazwą:
          [PEŁNA NAZWA DZIAŁALNOŚCI FILIPA PRONIEWICZA], NIP: [NIP], adres:
          [ADRES DZIAŁALNOŚCI].
        </p>

        <h2>Zakres usług</h2>
        <p>
          Serwis prezentuje usługi świadczone przez Usługodawcę, w szczególności
          konsultacje online, konsultacje stacjonarne, trening zdrowia,
          indywidualną pracę ruchową, pakiety współpracy oraz materiały
          edukacyjne.
        </p>
        <p>
          Materiały online są obecnie bezpłatnym wsparciem współpracy
          konsultacyjnej, treningowej lub edukacyjnej i nie stanowią osobnego
          płatnego produktu.
        </p>

        <h2>Konto i kod dostępu</h2>
        <p>
          Użytkownik może utworzyć konto, zalogować się i aktywować kod
          otrzymany od administratora. Kod może dawać dostęp do całej platformy,
          biblioteki materiałów albo konkretnego kursu, zgodnie z ustawieniami
          nadanymi przez administratora.
        </p>
        <p>
          Dostęp może zostać ograniczony lub cofnięty w szczególności wtedy,
          gdy użytkownik udostępnia konto osobom trzecim, publikuje lub
          odsprzedaje kod dostępu, dochodzi do nadużycia lub próby obejścia
          zabezpieczeń, wymagają tego względy techniczne, bezpieczeństwa albo
          prawne lub materiał przestaje być utrzymywany w Serwisie.
        </p>
        <p>
          Wygaśnięcie sesji logowania nie oznacza utraty wcześniej przyznanego
          dostępu do materiałów. Po ponownym zalogowaniu dostęp pozostaje
          widoczny, o ile nadal jest aktywny.
        </p>

        <h2>Okres dostępu</h2>
        <p>
          Jeżeli przy danym materiale nie wskazano konkretnego okresu dostępu,
          pozostaje on dostępny przez okres jego utrzymywania w Serwisie.
        </p>

        <h2>Materiały edukacyjne</h2>
        <p>
          Materiały, filmy, instrukcje i pliki mają charakter edukacyjny. Nie
          stanowią indywidualnej diagnozy dla użytkownika, nie zastępują
          indywidualnego badania ani konsultacji ze specjalistą. Ćwiczenia
          należy wykonywać adekwatnie do swoich możliwości.
        </p>
        <p>
          W przypadku bólu, urazu, pogorszenia samopoczucia lub innych
          niepokojących objawów należy przerwać wykonywanie ćwiczeń i w razie
          potrzeby skonsultować się z odpowiednim specjalistą.
        </p>

        <h2>Konsultacje i ceny</h2>
        <p>
          Aktualne ceny mogą być publikowane w Serwisie. Termin, miejsce,
          zakres i szczegóły konsultacji, treningu zdrowia albo pakietu
          współpracy są ustalane indywidualnie przed realizacją usługi.
          Użytkownik powinien znać cenę i podstawowe warunki usługi przed jej
          rozpoczęciem.
        </p>
        <p>
          W przypadku konieczności odwołania wizyty użytkownik powinien
          poinformować Usługodawcę możliwie jak najwcześniej.
        </p>

        <h2>Prawa autorskie</h2>
        <p>
          Wszystkie materiały dostępne w Serwisie są chronione prawem autorskim.
          Użytkownik może korzystać z nich na zwykły użytek własny. Nie wolno
          ich dalej publikować, odsprzedawać, udostępniać osobom trzecim,
          udostępniać konta ani przekazywać lub publikować kodów dostępu.
        </p>

        <h2>Reklamacje i kontakt</h2>
        <p>
          Reklamacje, sprawy techniczne i pytania dotyczące dostępu można
          zgłaszać na adres e-mail: kontakt@swiadomyprofilciala.pl. Reklamacja
          powinna zawierać opis problemu oraz dane pozwalające zidentyfikować
          konto lub usługę, której dotyczy.
        </p>

        <h2>Zmiany regulaminu</h2>
        <p>
          Regulamin może być aktualizowany, zwłaszcza przy zmianie zakresu
          usług, danych działalności albo sposobu udostępniania materiałów.
          Nowa wersja będzie publikowana na tej stronie. Zmiany Regulaminu nie
          wpływają na prawa nabyte przez użytkowników przed wejściem nowej
          wersji w życie.
        </p>
      </div>
    </section>
  );
}
