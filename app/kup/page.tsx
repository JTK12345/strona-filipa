import type { Metadata } from "next";
import Link from "next/link";
import { coursePaths } from "@/content/courses";

const plans = [
  {
    name: "Pojedynczy kurs",
    price: "149 zł",
    description: "Dostęp do jednego programu wideo i materiałów do wdrożenia.",
  },
  {
    name: "Biblioteka miesięczna",
    price: "49 zł / mies.",
    description: "Dostęp do krótkich lekcji, rutyn i materiałów edukacyjnych.",
  },
  {
    name: "Premium",
    price: "349 zł",
    description: "Kursy, biblioteka i konsultacja startowa pomagająca dobrać kierunek.",
  },
];

export const metadata: Metadata = {
  title: "Kup dostęp | Świadomy Profil Ciała",
  description: "Testowy zakup dostępu do kursów i biblioteki.",
};

export default async function BuyPage(props: PageProps<"/kup">) {
  const searchParams = await props.searchParams;
  const hasError = searchParams.error === "1";

  return (
    <section className="checkout-page">
      <div className="container-main">
        <div className="checkout-hero">
          <span className="eyebrow">Zakup dostępu</span>
          <h1>Wybierz dostęp do kursów i biblioteki.</h1>
          <p>
            To jest testowy checkout przed integracją Stripe. Formularz nadaje dostęp
            do panelu bez pobierania płatności.
          </p>
        </div>

        <div className="checkout-grid">
          {plans.map((plan) => (
            <article key={plan.name} className="checkout-plan">
              <p className="checkout-plan__name">{plan.name}</p>
              <h2>{plan.price}</h2>
              <p>{plan.description}</p>
            </article>
          ))}
        </div>

        <div className="checkout-shell">
          <form action="/api/checkout/test" method="post" className="checkout-form">
            <div>
              <p className="auth-card__label">Tryb testowy</p>
              <h2>Nadaj dostęp testowy</h2>
            </div>

            {hasError ? <p className="auth-error">Podaj poprawny adres e-mail.</p> : null}

            <label>
              <span>E-mail użytkownika</span>
              <input name="email" type="email" required autoComplete="email" />
            </label>

            <button type="submit" className="button-primary">
              Kup testowo i przejdź do panelu
            </button>
          </form>

          <aside className="checkout-summary">
            <p className="checkout-plan__name">Co zobaczy użytkownik</p>
            <div>
              {coursePaths.map((course) => (
                <p key={course.slug} className="check-row">
                  {course.title}
                </p>
              ))}
            </div>
            <Link href="/logowanie" className="button-secondary">
              Mam już kod admina
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
