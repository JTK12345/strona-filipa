import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Logowanie | Świadomy Profil Ciała",
  description: "Logowanie do panelu kursów.",
};

export default async function LoginPage(props: PageProps<"/logowanie">) {
  const searchParams = await props.searchParams;
  const hasError = searchParams.error === "1";

  return (
    <section className="auth-page">
      <div className="container-main">
        <div className="auth-shell">
          <div className="auth-copy">
            <span className="eyebrow">Logowanie</span>
            <h1>Wejdź do panelu kursów.</h1>
            <p>
              Na tym etapie działa tryb testowy. Administrator może wejść kodem
              z pliku `.env`, a zakup testowy nadaje dostęp bez prawdziwej płatności.
            </p>
            <Link href="/kup" className="button-secondary mt-8">
              Chcę kupić dostęp testowo
            </Link>
          </div>

          <form action="/api/auth/login" method="post" className="auth-card">
            <div>
              <p className="auth-card__label">Dostęp administracyjny</p>
              <h2>Admin / test</h2>
            </div>

            {hasError ? (
              <p className="auth-error">Nieprawidłowy e-mail albo kod dostępu.</p>
            ) : null}

            <label>
              <span>E-mail</span>
              <input name="email" type="email" required autoComplete="email" />
            </label>

            <label>
              <span>Kod dostępu</span>
              <input name="code" type="password" required autoComplete="current-password" />
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
