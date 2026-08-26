import type { Metadata } from "next";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Polityka prywatności | Świadomy Profil Ciała",
};

// TODO: przed produkcją uzupełnić dane działalności.
// TODO: przed produkcją zweryfikować podstawę przetwarzania danych dotyczących zdrowia zgodnie z faktycznym sposobem świadczenia usług i prowadzenia dokumentacji.
export default function PrivacyPage() {
  return (
    <section className="legal-page">
      <div className="container-main legal-document">
        <BackHomeLink />
        <span className="legal-draft">Ostatnia aktualizacja: [DATA WEJŚCIA W ŻYCIE]</span>
        <h1>Polityka prywatności</h1>
        <p>
          Polityka opisuje, jakie dane są przetwarzane w związku z Serwisem
          Świadomy Profil Ciała, kontem użytkownika, kodami dostępu,
          materiałami edukacyjnymi oraz kontaktem w sprawie konsultacji.
        </p>

        <h2>Administrator danych</h2>
        <p>
          Administratorem danych jest Filip Proniewicz, działający pod nazwą:
          [PEŁNA NAZWA DZIAŁALNOŚCI FILIPA PRONIEWICZA], NIP: [NIP], adres:
          [ADRES DZIAŁALNOŚCI]. Kontakt z Administratorem:
          kontakt@swiadomyprofilciala.pl.
        </p>
        <p>
          Administrator techniczny serwera nie jest administratorem danych
          klientów. Może mieć dostęp do danych wyłącznie w zakresie niezbędnym
          do technicznego utrzymania Serwisu, bezpieczeństwa i diagnozowania
          błędów.
        </p>

        <h2>Dane konta i dostępu</h2>
        <p>
          W ramach konta użytkownika Serwis przetwarza adres e-mail, hasło w
          postaci zabezpieczonego skrótu, dane sesji, aktywowane kody,
          przyznane dostępy, postęp materiałów oraz notatki użytkownika, jeżeli
          zostały zapisane w ramach lekcji.
        </p>

        <h2>Dane dotyczące zdrowia</h2>
        <p>
          Dane Serwisu internetowego obejmują dane konta, dostępu, aktywności w
          materiałach i dane techniczne potrzebne do działania strony. Serwis
          internetowy nie jest przeznaczony do prowadzenia ani przechowywania
          dokumentacji medycznej.
        </p>
        <p>
          Informacje dotyczące zdrowia mogą być przetwarzane w ramach
          indywidualnej konsultacji lub innej usługi świadczonej przez
          Administratora, jeśli jest to niezbędne do realizacji tej usługi.
          W pierwszym kontakcie e-mailowym lub przez media społecznościowe
          prosimy nie przesyłać pełnej dokumentacji medycznej ani szczegółowych
          danych zdrowotnych, jeśli nie zostało to wcześniej uzgodnione.
        </p>

        <h2>Cele i podstawy przetwarzania</h2>
        <p>
          Obsługa konta i dostępu obejmuje utworzenie konta, logowanie,
          utrzymanie sesji oraz udostępnienie materiałów. Podstawą
          przetwarzania jest wykonanie umowy lub podjęcie działań na żądanie
          użytkownika przed jej zawarciem.
        </p>
        <p>
          Kontakt obejmuje odpowiedź na e-mail, kontakt telefoniczny, kontakt
          przez Instagram oraz ustalenie konsultacji. Podstawą przetwarzania
          jest podjęcie działań na żądanie osoby, której dane dotyczą, albo
          uzasadniony interes Administratora polegający na obsłudze
          korespondencji.
        </p>
        <p>
          Bezpieczeństwo obejmuje logi, adres IP, wykrywanie nadużyć, ochronę
          kont i diagnozowanie błędów. Podstawą przetwarzania jest uzasadniony
          interes Administratora polegający na ochronie Serwisu i użytkowników.
        </p>
        <p>
          Obowiązki prawne obejmują przetwarzanie danych wymaganych przez
          właściwe przepisy, jeżeli takie obowiązki mają zastosowanie. Podstawą
          przetwarzania jest wypełnienie obowiązku prawnego ciążącego na
          Administratorze.
        </p>

        <h2>Kontakt</h2>
        <p>
          Kontakt z Administratorem odbywa się przez telefon, e-mail lub
          Instagram. W związku z kontaktem mogą być przetwarzane dane podane w
          wiadomości oraz dane potrzebne do odpowiedzi lub ustalenia
          konsultacji.
        </p>

        <h2>Hosting i wsparcie techniczne</h2>
        <p>
          Serwis działa na infrastrukturze Oracle Cloud Infrastructure.
          Techniczna obsługa Serwisu może mieć dostęp do danych wyłącznie w
          zakresie potrzebnym do utrzymania, bezpieczeństwa i diagnozowania
          błędów.
        </p>

        <h2>Pliki cookies</h2>
        <p>
          Serwis używa technicznych plików cookies potrzebnych do logowania,
          utrzymania sesji i bezpieczeństwa. Obecnie są to cookie sesyjne
          <strong> spc_session</strong> oraz techniczne cookie CSRF:
          <strong> csrf-token</strong> w środowisku lokalnym albo
          <strong> __Host-csrf-token</strong> w środowisku produkcyjnym. Serwis
          nie używa cookies marketingowych ani analitycznych.
        </p>

        <h2>Okres przechowywania danych</h2>
        <p>
          Dane konta są przechowywane przez okres aktywności konta oraz przez
          okres potrzebny do ochrony ewentualnych roszczeń. Korespondencja jest
          przechowywana przez okres potrzebny do obsługi sprawy. Logi i dane
          techniczne są przechowywane przez okres uzasadniony bezpieczeństwem i
          diagnostyką. Dane wymagane prawem są przechowywane przez okres
          wynikający z właściwych przepisów.
        </p>

        <h2>Prawa użytkownika</h2>
        <p>
          Użytkownik ma prawo dostępu do danych, sprostowania, usunięcia,
          ograniczenia przetwarzania, sprzeciwu, przenoszenia danych, jeżeli ma
          zastosowanie, oraz cofnięcia zgody, jeśli przetwarzanie jest oparte
          na zgodzie. Użytkownik ma także prawo wniesienia skargi do Prezesa
          Urzędu Ochrony Danych Osobowych.
        </p>
      </div>
    </section>
  );
}
