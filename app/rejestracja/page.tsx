import type { Metadata } from "next";
import Link from "next/link";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Rejestracja | Świadomy Profil Ciała",
  description: "Utwórz konto użytkownika platformy kursowej.",
};

const errorMessages: Record<string, string> = {
  invalid: "Podaj poprawny adres e-mail i hasło mające co najmniej 10 znaków.",
  mismatch: "Wpisane hasła nie są takie same.",
  exists: "Konto z tym adresem e-mail już istnieje. Zaloguj się.",
  rate: "Zbyt wiele prób rejestracji. Odczekaj kilka minut i spróbuj ponownie.",
  server: "Nie udało się utworzyć konta. Spróbuj ponownie.",
};

export default async function RegisterPage(props: PageProps<"/rejestracja">) {
  const searchParams = await props.searchParams;
  const requestedNext =
    searchParams.next === "/biblioteka" ||
    searchParams.next === "/panel" ||
    searchParams.next === "/kup"
      ? searchParams.next
      : "/panel";
  const errorMessage =
    typeof searchParams.error === "string" ? errorMessages[searchParams.error] : null;

  return (
    <section className="auth-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="auth-shell">
          <div className="auth-copy">
            <span className="eyebrow">Nowe konto</span>
            <h1>Utwórz konto do kursów i biblioteki.</h1>
            <p>
              Konto pozwala bezpiecznie logować się do panelu. Dostęp do płatnych
              materiałów pojawi się po zakupie lub nadaniu uprawnienia.
            </p>
            <Link href="/logowanie" className="button-secondary mt-8">
              Mam już konto
            </Link>
          </div>

          <form action="/api/auth/register" method="post" className="auth-card">
            <div>
              <p className="auth-card__label">Rejestracja</p>
              <h2>Załóż konto</h2>
            </div>

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            <input type="hidden" name="next" value={requestedNext} />

            <label>
              <span>E-mail</span>
              <input name="email" type="email" required autoComplete="email" />
            </label>

            <label>
              <span>Hasło</span>
              <input
                name="password"
                type="password"
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>

            <label>
              <span>Powtórz hasło</span>
              <input
                name="passwordConfirmation"
                type="password"
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>

            <button type="submit" className="button-primary">
              Utwórz konto
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
