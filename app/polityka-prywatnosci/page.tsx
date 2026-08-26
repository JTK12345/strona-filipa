import type { Metadata } from "next";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Polityka prywatności | Świadomy Profil Ciała",
};

// TODO(production): uzupelnic dane administratora, NIP, adres i date wejscia w zycie.
export default function PrivacyPage() {
  return (
    <section className="legal-page">
      <div className="container-main legal-document">
        <BackHomeLink />
        <span className="legal-draft">Ostatnia aktualizacja: [DATA WEJŚCIA W ŻYCIE]</span>
        <h1>Polityka prywatności</h1>
        <p>
          Polityka opisuje, jakie dane są przetwarzane w związku ze stroną,
          kontem użytkownika, kodami dostępu, materiałami edukacyjnymi i
          kontaktem w sprawie konsultacji.
        </p>
        <h2>Administrator danych</h2>
        <p>
          Administratorem danych jest Filip Proniewicz, działający pod przyszłą
          lub właściwą nazwą: [PEŁNA NAZWA DZIAŁALNOŚCI FILIPA PRONIEWICZA],
          NIP: [NIP], adres: [ADRES DZIAŁALNOŚCI]. Kontakt:
          kontakt@swiadomyprofilciala.pl.
        </p>
        <h2>Konto i dostęp</h2>
        <p>
          Przy zakładaniu i obsłudze konta przetwarzamy adres e-mail, hasło w
          postaci zabezpieczonego skrótu, dane sesji, nadane dostępy, aktywowane
          kody, postęp lekcji oraz notatki zapisane przez użytkownika. Dane są
          potrzebne do obsługi konta, zabezpieczenia dostępu i udostępniania
          materiałów.
        </p>
        <h2>Kontakt i konsultacje</h2>
        <p>
          Przy kontakcie e-mail, telefonicznym lub przez Instagram możemy
          przetwarzać imię, nazwisko, dane kontaktowe oraz treść wiadomości. W
          sprawach konsultacji mogą pojawić się informacje dotyczące zdrowia,
          jeśli użytkownik sam je przekaże. Nie należy przesyłać pełnej
          dokumentacji medycznej w pierwszej wiadomości kontaktowej.
        </p>
        <h2>Materiały i dane techniczne</h2>
        <p>
          Serwis może zapisywać informacje techniczne, takie jak adres IP,
          nagłówki przeglądarki, logi bezpieczeństwa, daty logowania i działania
          administracyjne. Są one używane do ochrony kont, diagnozowania błędów
          i utrzymania bezpieczeństwa.
        </p>
        <h2>Hosting i wsparcie techniczne</h2>
        <p>
          Strona działa na infrastrukturze Oracle Cloud Infrastructure. Dostęp
          techniczny do serwera może mieć osoba wspierająca administratora w
          utrzymaniu strony, wyłącznie w zakresie potrzebnym do obsługi
          technicznej, bezpieczeństwa i naprawy błędów.
        </p>
        <h2>Pliki cookies</h2>
        <p>
          Serwis używa technicznych plików cookies potrzebnych do logowania,
          utrzymania sesji, zabezpieczeń oraz działania konta. Bez nich dostęp
          do panelu i materiałów po kodzie nie działałby prawidłowo.
        </p>
        <h2>Podstawy i okres przetwarzania</h2>
        <p>
          Dane są przetwarzane w celu obsługi konta i usług, kontaktu,
          zabezpieczenia serwisu, realizacji uzasadnionych interesów
          administratora oraz wykonania obowiązków prawnych. Dane przechowujemy
          przez czas potrzebny do realizacji tych celów, a następnie przez okres
          wymagany przepisami albo konieczny do ochrony roszczeń.
        </p>
        <h2>Prawa użytkownika</h2>
        <p>
          Użytkownik ma prawo dostępu do danych, sprostowania, usunięcia,
          ograniczenia przetwarzania, przenoszenia danych, sprzeciwu oraz
          cofnięcia zgody, jeśli przetwarzanie odbywa się na jej podstawie.
          Przysługuje także prawo wniesienia skargi do Prezesa Urzędu Ochrony
          Danych Osobowych.
        </p>
        <h2>Uwagi przed publikacją</h2>
        <p>
          Dane działalności, datę wejścia w życie oraz ewentualne szczegóły
          formalne należy uzupełnić przed produkcyjnym uruchomieniem dokumentu.
        </p>
      </div>
    </section>
  );
}
