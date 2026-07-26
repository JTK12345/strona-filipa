import type { Metadata } from "next";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Polityka prywatności | Świadomy Profil Ciała",
};

export default function PrivacyPage() {
  return (
    <section className="legal-page">
      <div className="container-main legal-document">
        <BackHomeLink />
        <span className="legal-draft">Projekt przed uruchomieniem sprzedaży</span>
        <h1>Polityka prywatności</h1>
        <p>
          Ten dokument jest miejscem na finalną politykę prywatności. Przed
          uruchomieniem sprzedaży musi zawierać dane administratora, cele i
          podstawy przetwarzania, okresy przechowywania, odbiorców danych oraz
          opis praw użytkownika.
        </p>
        <h2>Konto i zakup</h2>
        <p>
          Platforma przetwarza adres e-mail, dane sesji, historię zamówień,
          nadane dostępy, postęp lekcji i notatki potrzebne do działania konta.
        </p>
        <h2>Operator płatności</h2>
        <p>
          Po rozpoczęciu płatności użytkownik przechodzi do Przelewy24. Finalny
          dokument musi opisywać zakres przekazywanych danych i właściwe podstawy
          ich przetwarzania.
        </p>
      </div>
    </section>
  );
}
