import type { Metadata } from "next";
import Link from "next/link";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Reset hasła | Świadomy Profil Ciała",
  description: "Poproś o link do ustawienia nowego hasła.",
};

export default async function PasswordResetPage(
  props: PageProps<"/reset-hasla">,
) {
  const searchParams = await props.searchParams;
  const sent = searchParams.sent === "1";

  return (
    <section className="auth-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="auth-shell">
          <div className="auth-copy">
            <span className="eyebrow">Reset hasła</span>
            <h1>Ustaw nowe hasło do konta.</h1>
            <p>
              Wpisz adres e-mail użyty przy rejestracji. Jeśli konto istnieje,
              wyślemy link do ustawienia nowego hasła.
            </p>
            <Link href="/logowanie" className="button-secondary mt-8">
              Wróć do logowania
            </Link>
          </div>

          <form
            action="/api/auth/password-reset/request"
            method="post"
            className="auth-card"
          >
            <div>
              <p className="auth-card__label">Bezpieczny dostęp</p>
              <h2>Przypomnij hasło</h2>
            </div>

            {sent ? (
              <p className="auth-notice">
                Jeśli konto z tym adresem e-mail istnieje, wysłaliśmy instrukcję
                resetowania hasła.
              </p>
            ) : null}

            <label>
              <span>E-mail</span>
              <input name="email" type="email" required autoComplete="email" />
            </label>

            <button type="submit" className="button-primary">
              Wyślij link resetujący
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
