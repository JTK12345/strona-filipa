import type { Metadata } from "next";
import Link from "next/link";
import { BackHomeLink } from "@/components/BackHomeLink";
import { getPasswordResetTokenState } from "@/app/lib/password-reset";

export const metadata: Metadata = {
  title: "Nowe hasło | Świadomy Profil Ciała",
  description: "Ustaw nowe hasło do konta.",
};

const errorMessages: Record<string, string> = {
  invalid: "Link resetujący jest nieprawidłowy albo został już użyty.",
  expired: "Link resetujący wygasł. Poproś o nowy link.",
  weak_password: "Hasło musi mieć co najmniej 10 znaków.",
  mismatch: "Wpisane hasła nie są takie same.",
  rate: "Zbyt wiele prób. Odczekaj kilka minut i spróbuj ponownie.",
  server: "Nie udało się zmienić hasła. Spróbuj ponownie.",
};

export default async function NewPasswordPage(
  props: PageProps<"/reset-hasla/nowe">,
) {
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  const tokenState = await getPasswordResetTokenState(token);
  const errorKey = typeof searchParams.error === "string" ? searchParams.error : "";
  const errorMessage =
    errorMessages[errorKey] ??
    (tokenState === "expired"
      ? errorMessages.expired
      : tokenState === "invalid"
        ? errorMessages.invalid
        : null);
  const canReset = tokenState === "valid";

  return (
    <section className="auth-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="auth-shell">
          <div className="auth-copy">
            <span className="eyebrow">Nowe hasło</span>
            <h1>{canReset ? "Wpisz nowe hasło." : "Link nie jest aktywny."}</h1>
            <p>
              Link resetujący działa tylko raz i wygasa po 60 minutach. Po
              zmianie hasła zalogujesz się już nowymi danymi.
            </p>
            <Link href="/logowanie" className="button-secondary mt-8">
              Wróć do logowania
            </Link>
          </div>

          <form
            action="/api/auth/password-reset/confirm"
            method="post"
            className="auth-card"
          >
            <div>
              <p className="auth-card__label">Reset hasła</p>
              <h2>Ustaw nowe hasło</h2>
            </div>

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            {canReset ? (
              <>
                <input type="hidden" name="token" value={token} />
                <label>
                  <span>Nowe hasło</span>
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
                  <span>Powtórz nowe hasło</span>
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
                  Zmień hasło
                </button>
              </>
            ) : (
              <Link href="/reset-hasla" className="button-primary">
                Poproś o nowy link
              </Link>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
