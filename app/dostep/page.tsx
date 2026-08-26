import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getAccessibleCourses } from "@/app/lib/courses";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Kod dostępu | Świadomy Profil Ciała",
  description: "Aktywuj dostęp do materiałów.",
};

const codeMessages: Record<string, string> = {
  success: "Kod został przyjęty. Materiały są już dostępne na Twoim koncie.",
  invalid: "Wpisz poprawny kod.",
  not_found: "Ten kod nie istnieje.",
  expired: "Ten kod wygasł albo został wyłączony.",
  used: "Ten kod został już wykorzystany.",
  already_has_access: "To konto ma już aktywny dostęp.",
  already_redeemed: "Ten kod był już użyty na tym koncie.",
  rate: "Zbyt wiele prób. Odczekaj kilka minut.",
  server: "Nie udało się aktywować kodu. Spróbuj ponownie.",
};

export default async function AccessPage(props: PageProps<"/dostep">) {
  const [session, searchParams] = await Promise.all([
    getCurrentAccessSession(),
    props.searchParams,
  ]);
  const accessibleCourses = session
    ? await getAccessibleCourses(session.userId, session.role === "admin")
    : [];
  const hasAccess = Boolean(session?.hasAnyAccess || accessibleCourses.length > 0);
  const codeResult =
    typeof searchParams.code === "string" ? searchParams.code : "";
  const codeMessage = codeMessages[codeResult];

  return (
    <section className="access-page">
      <div className="container-main">
        <BackHomeLink />

        <div className="access-activation-card">
          {!session ? (
            <>
              <span className="eyebrow">Dostęp</span>
              <h1>Aktywuj dostęp do materiałów</h1>
              <p>
                Zaloguj się lub utwórz konto, aby aktywować otrzymany kod
                dostępu.
              </p>
              <div className="access-actions">
                <Link href="/logowanie?next=/dostep" className="button-primary">
                  Zaloguj się
                </Link>
                <Link href="/rejestracja?next=/dostep" className="button-secondary">
                  Utwórz konto
                </Link>
              </div>
            </>
          ) : hasAccess ? (
            <>
              <span className="eyebrow">Dostęp</span>
              <h1>Masz aktywny dostęp do materiałów.</h1>
              <div className="access-state">
                {codeMessage ? (
                  <p className="auth-notice">{codeMessage}</p>
                ) : null}
                <Link href="/panel" className="button-primary">
                  Przejdź do materiałów
                </Link>
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow">Dostęp</span>
              <h1>Wpisz kod dostępu</h1>
              <p>Wpisz otrzymany kod, aby dodać materiały do swojego konta.</p>
              <form action="/api/access-codes/redeem" method="post" className="access-form">
                {codeMessage ? (
                  <p className={codeResult === "success" || codeResult === "already_has_access" ? "auth-notice" : "auth-error"}>
                    {codeMessage}
                  </p>
                ) : null}
                <label>
                  <span>Kod dostępu</span>
                  <input name="code" required autoComplete="one-time-code" />
                </label>
                <button type="submit" className="button-primary">
                  Aktywuj dostęp
                </button>
                <p className="access-hint">
                  Po aktywacji materiały pojawią się na Twoim koncie.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
