import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getAccessibleCourses } from "@/app/lib/courses";
import { BackHomeLink } from "@/components/BackHomeLink";
import { accessFeatures, premiumAccessBlocks } from "@/content/courses";

export const metadata: Metadata = {
  title: "Kod dostępu | Świadomy Profil Ciała",
  description: "Wpisz kod i odblokuj materiały wideo oraz instrukcje.",
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
    <section className="access-premium-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="access-premium-hero">
          <div className="access-premium-copy">
            <span className="eyebrow">Kod dostępu</span>
            <h1>Odblokuj filmy, instrukcje i materiały od administratora.</h1>
            <p>
              Załóż konto albo zaloguj się, wpisz otrzymany kod i korzystaj z
              materiałów opublikowanych w bibliotece.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {session ? (
                hasAccess ? null : (
                  <Link href="/panel" className="button-secondary">
                    Otwórz panel
                  </Link>
                )
              ) : (
                <>
                  <Link href="/logowanie?next=/dostep" className="button-primary">
                    Zaloguj się
                  </Link>
                  <Link href="/rejestracja?next=/dostep" className="button-secondary">
                    Utwórz konto
                  </Link>
                </>
              )}
              {hasAccess ? (
                <Link href="/panel" className="button-primary">
                  Przejdź do materiałów
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="access-dashboard">
            <div className="access-dashboard__top">
              <div>
                <p className="access-dashboard__label">Aktywacja</p>
                <h2>Wpisz kod</h2>
              </div>
              <span>{session ? "Konto" : "Login"}</span>
            </div>

            {session && hasAccess ? (
              <div className="admin-grant-form">
                {codeMessage ? (
                  <p className="auth-notice">{codeMessage}</p>
                ) : null}
                <p className="auth-notice">
                  Masz już aktywny dostęp na tym koncie. Materiały są dostępne w
                  panelu użytkownika.
                </p>
                <div className="grid gap-3">
                  {accessibleCourses.slice(0, 3).map((course) => (
                    <Link
                      key={course.slug}
                      href={`/panel/kursy/${course.slug}`}
                      className="button-primary"
                    >
                      Przejdź do kursu: {course.title}
                    </Link>
                  ))}
                  {session.hasLibraryAccess ? (
                    <Link href="/biblioteka" className="button-secondary">
                      Otwórz bibliotekę
                    </Link>
                  ) : null}
                  <Link href="/panel" className="button-secondary">
                    Otwórz panel
                  </Link>
                </div>
              </div>
            ) : session ? (
              <form action="/api/access-codes/redeem" method="post" className="admin-grant-form">
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
              </form>
            ) : (
              <p className="auth-notice">
                Najpierw zaloguj się lub utwórz konto, żeby przypisać kod do
                konkretnego użytkownika.
              </p>
            )}

            <div className="access-dashboard__list">
              {accessFeatures.map((feature) => (
                <p key={feature} className="check-row">{feature}</p>
              ))}
            </div>
          </aside>
        </div>

        <div className="access-premium-grid">
          {premiumAccessBlocks.map((block) => (
            <article key={block.title} className="access-value-card">
              <h2>{block.title}</h2>
              <p>{block.description}</p>
            </article>
          ))}
        </div>

        <div className="access-roadmap">
          <div>
            <span className="eyebrow">Jak działa teraz</span>
            <h2>Kod łączy konto i materiały w jednym miejscu.</h2>
          </div>
          <div className="access-roadmap__steps">
            <p><strong>1.</strong> Użytkownik tworzy konto albo loguje się do istniejącego.</p>
            <p><strong>2.</strong> Wpisuje kod otrzymany od administratora.</p>
            <p><strong>3.</strong> Biblioteka i materiały pojawiają się w panelu konta.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
