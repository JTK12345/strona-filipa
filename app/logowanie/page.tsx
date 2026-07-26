import type { Metadata } from "next";
import Link from "next/link";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Logowanie | Świadomy Profil Ciała",
  description: "Logowanie do panelu kursów.",
};

const errorMessages: Record<string, string> = {
  credentials: "Nieprawidłowy e-mail lub hasło.",
  rate: "Zbyt wiele prób logowania. Odczekaj kilka minut i spróbuj ponownie.",
  server: "Nie udało się zalogować. Spróbuj ponownie.",
};

export default async function LoginPage(props: PageProps<"/logowanie">) {
  const searchParams = await props.searchParams;
  const requestedNext =
    searchParams.next === "/biblioteka" ||
    searchParams.next === "/panel" ||
    searchParams.next === "/kup"
      ? searchParams.next
      : "/panel";
  const requiresLogin = searchParams.next === "/biblioteka" || searchParams.next === "/panel";
  const errorMessage =
    typeof searchParams.error === "string" ? errorMessages[searchParams.error] : null;

  return (
    <section className="auth-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="auth-shell">
          <div className="auth-copy">
            <span className="eyebrow">Logowanie</span>
            <h1>Zaloguj się do swoich materiałów.</h1>
            <p>
              Użyj adresu e-mail i hasła podanego podczas rejestracji. Po zalogowaniu
              zobaczysz panel konta oraz materiały objęte aktywnym dostępem.
            </p>
            <Link href={`/rejestracja?next=${requestedNext}`} className="button-secondary mt-8">
              Utwórz konto
            </Link>
          </div>

          <form action="/api/auth/login" method="post" className="auth-card">
            <div>
              <p className="auth-card__label">Twoje konto</p>
              <h2>Logowanie</h2>
            </div>

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            {requiresLogin && !errorMessage ? (
              <p className="auth-notice">
                Zaloguj się, aby przejść do wybranej części platformy.
              </p>
            ) : null}

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
                maxLength={128}
                autoComplete="current-password"
              />
            </label>

            <button type="submit" className="button-primary">
              Zaloguj do panelu
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
