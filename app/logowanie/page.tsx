import type { Metadata } from "next";
import Link from "next/link";
import { BackHomeLink } from "@/components/BackHomeLink";
import { sanitizeAuthDestination } from "@/app/lib/auth-destination";

export const metadata: Metadata = {
  title: "Logowanie | Świadomy Profil Ciała",
  description: "Logowanie do panelu admina i materiałów dla subskrybentów.",
};

const errorMessages: Record<string, string> = {
  credentials: "Nieprawidłowy e-mail lub hasło.",
  rate: "Zbyt wiele prób logowania. Odczekaj kilka minut i spróbuj ponownie.",
  server: "Nie udało się zalogować. Spróbuj ponownie.",
};

const resetMessages: Record<string, string> = {
  changed: "Hasło zostało zmienione. Możesz się zalogować.",
};

const verificationMessages: Record<string, string> = {
  verified: "Adres e-mail został potwierdzony. Możesz się zalogować.",
};

export default async function LoginPage(props: PageProps<"/logowanie">) {
  const searchParams = await props.searchParams;
  const requestedNext = sanitizeAuthDestination(searchParams.next);
  const requiresLogin = searchParams.next === requestedNext;
  const errorMessage =
    typeof searchParams.error === "string" ? errorMessages[searchParams.error] : null;
  const resetMessage =
    typeof searchParams.reset === "string" ? resetMessages[searchParams.reset] : null;
  const verificationMessage =
    typeof searchParams.verification === "string"
      ? verificationMessages[searchParams.verification]
      : null;

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
              <p className="auth-card__label">Panel i materiały</p>
              <h2>Logowanie</h2>
            </div>

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
            {resetMessage ? <p className="auth-notice">{resetMessage}</p> : null}
            {verificationMessage ? <p className="auth-notice">{verificationMessage}</p> : null}

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
              Zaloguj się
            </button>

            <Link href="/reset-hasla" className="auth-small-link">
              Nie pamiętasz hasła?
            </Link>
          </form>
        </div>
      </div>
    </section>
  );
}
