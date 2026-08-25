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
        <span className="legal-draft">Projekt polityki prywatności</span>
        <h1>Polityka prywatności</h1>
        <p>
          Ten dokument jest miejscem na finalną politykę prywatności. Przed
          uruchomieniem platformy musi zawierać dane administratora, cele i
          podstawy przetwarzania, okresy przechowywania, odbiorców danych oraz
          opis praw użytkownika.
        </p>
        <h2>Konto i dostęp</h2>
        <p>
          Platforma przetwarza adres e-mail, dane sesji, aktywowane kody,
          nadane dostępy, postęp lekcji i notatki potrzebne do działania konta.
        </p>
        <h2>Pliki i materiały</h2>
        <p>
          Administrator może dodawać materiały wideo, instrukcje i pliki
          dostępne tylko dla kont z aktywnym uprawnieniem.
        </p>
      </div>
    </section>
  );
}
