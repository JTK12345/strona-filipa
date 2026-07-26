import type { Metadata } from "next";
import Link from "next/link";
import {
  formatCoursePrice,
  getCourseStatusLabel,
  getPublishedCourses,
} from "@/app/lib/courses";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Kup dostęp | Świadomy Profil Ciała",
  description: "Testowy zakup dostępu do kursów i biblioteki.",
};

export default async function BuyPage(props: PageProps<"/kup">) {
  const searchParams = await props.searchParams;
  const courses = await getPublishedCourses();
  const hasEmailError = searchParams.error === "email";
  const isCheckoutDisabled = searchParams.error === "disabled";
  const requiresAccess = searchParams.required === "1";

  return (
    <section className="checkout-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="checkout-hero">
          <span className="eyebrow">Zakup dostępu</span>
          <h1>Wybierz dostęp do kursów i biblioteki.</h1>
          <p>
            Po aktywacji otrzymasz jedno miejsce do nauki: kursy wideo, krótkie lekcje,
            notatki, materiały praktyczne i bibliotekę tematów związanych ze zdrowiem
            oraz ruchem. Obecny formularz działa testowo i nie pobiera płatności.
          </p>
        </div>

        {requiresAccess ? (
          <div className="panel-alert">
            Biblioteka jest dostępna po aktywacji wybranego pakietu.
          </div>
        ) : null}

        <div className="checkout-grid">
          {courses.map((course) => (
            <article key={course.slug} className="checkout-plan">
              <p className="checkout-plan__name">{getCourseStatusLabel(course)}</p>
              <h2>{formatCoursePrice(course)}</h2>
              <h3 className="mt-3 text-xl font-bold">{course.title}</h3>
              <p>{course.description}</p>
              <p className="font-bold">
                {course.duration} · {course.level}
              </p>
            </article>
          ))}
        </div>

        <div className="checkout-shell">
          <form action="/api/checkout/test" method="post" className="checkout-form">
            <div>
              <p className="auth-card__label">Tryb testowy</p>
              <h2>Nadaj dostęp testowy</h2>
            </div>

            {hasEmailError ? (
              <p className="auth-error">Podaj poprawny adres e-mail.</p>
            ) : null}
            {isCheckoutDisabled ? (
              <p className="auth-error">
                Zakup testowy jest wyłączony. Skontaktuj się w sprawie aktywacji dostępu.
              </p>
            ) : null}

            <label>
              <span>E-mail użytkownika</span>
              <input name="email" type="email" required autoComplete="email" />
            </label>

            <button type="submit" className="button-primary">
              Kup testowo i przejdź do panelu
            </button>
          </form>

          <aside className="checkout-summary">
            <div>
              <p className="checkout-plan__name">W ramach dostępu</p>
              <h2>Wszystkie materiały w jednym panelu</h2>
            </div>
            <div className="checkout-benefits">
              <div className="check-row">
                <strong>Kursy i lekcje wideo</strong>
                <span>Programy podzielone na krótkie, uporządkowane moduły.</span>
              </div>
              <div className="check-row">
                <strong>Biblioteka wiedzy</strong>
                <span>Materiały o ruchu, bólu, regeneracji i profilaktyce.</span>
              </div>
              <div className="check-row">
                <strong>Notatki i materiały praktyczne</strong>
                <span>Podsumowania, zadania i wskazówki do samodzielnej pracy.</span>
              </div>
              <div className="check-row">
                <strong>Dostęp po zalogowaniu</strong>
                <span>
                  Zakup aktywuje bibliotekę, notatki, filmy kursowe i materiały
                  przypisane do konta.
                </span>
              </div>
            </div>
            <Link href="/logowanie" className="button-secondary">
              Mam już konto
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
