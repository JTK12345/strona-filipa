import type { Metadata } from "next";
import Link from "next/link";
import { BackHomeLink } from "@/components/BackHomeLink";
import { sanitizeAuthDestination } from "@/app/lib/auth-destination";
import { getEmailVerificationTokenState } from "@/app/lib/email-verification";

export const metadata: Metadata = {
  title: "Potwierdź e-mail | Świadomy Profil Ciała",
  description: "Potwierdź adres e-mail, aby aktywować konto.",
};

const resultMessages: Record<string, string> = {
  invalid: "Ten link jest nieprawidłowy albo został już wykorzystany.",
  expired: "Ten link wygasł. Wyślij nowy link aktywacyjny.",
};

export default async function VerifyEmailPage(props: PageProps<"/potwierdz-email">) {
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  const requestedNext = sanitizeAuthDestination(searchParams.next);
  const result = typeof searchParams.result === "string" ? searchParams.result : "";
  const sent = searchParams.sent === "1";
  const resend = searchParams.resend === "1";
  const tokenState = token ? await getEmailVerificationTokenState(token) : null;

  return (
    <section className="auth-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="auth-shell">
          <div className="auth-copy">
            <span className="eyebrow">Aktywacja konta</span>
            <h1>Potwierdź swój adres e-mail.</h1>
            <p>
              Zanim zalogujesz się do platformy, otwórz wiadomość aktywacyjną
              i potwierdź, że adres e-mail należy do Ciebie.
            </p>
            <Link href={`/logowanie?next=${requestedNext}`} className="button-secondary mt-8">
              Wróć do logowania
            </Link>
          </div>

          <div className="auth-card">
            <div>
              <p className="auth-card__label">E-mail</p>
              <h2>Aktywuj konto</h2>
            </div>

            {sent ? (
              <p className="auth-notice">
                Jeśli konto wymaga potwierdzenia, wysłaliśmy wiadomość z linkiem aktywacyjnym.
              </p>
            ) : null}
            {resend ? (
              <p className="auth-notice">
                Aby się zalogować, najpierw potwierdź adres e-mail. Możesz wysłać nowy link poniżej.
              </p>
            ) : null}
            {resultMessages[result] ? <p className="auth-error">{resultMessages[result]}</p> : null}

            {tokenState === "valid" ? (
              <form action="/api/auth/email-verification/confirm" method="post">
                <input type="hidden" name="token" value={token} />
                <button type="submit" className="button-primary">
                  Potwierdź adres e-mail
                </button>
              </form>
            ) : tokenState === "expired" ? (
              <p className="auth-error">Ten link wygasł. Wyślij nowy link aktywacyjny.</p>
            ) : tokenState === "invalid" ? (
              <p className="auth-error">Ten link jest nieprawidłowy albo został już wykorzystany.</p>
            ) : null}

            <form action="/api/auth/email-verification/request" method="post">
              <label>
                <span>Adres e-mail</span>
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <button type="submit" className="button-secondary mt-4">
                Wyślij nowy link
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
