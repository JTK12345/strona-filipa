import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentAccessSession } from "@/app/lib/access";
import {
  formatCoursePrice,
  getAccessibleCourses,
  getPublishedCourses,
} from "@/app/lib/courses";
import { isP24Enabled } from "@/app/lib/payments/przelewy24-config";
import { BackHomeLink } from "@/components/BackHomeLink";
import { CourseCheckout } from "@/components/course/CourseCheckout";

export const metadata: Metadata = {
  title: "Kup dostęp | Świadomy Profil Ciała",
  description:
    "Jednorazowy zakup kursów wideo o zdrowiu i świadomym ruchu.",
};

export default async function BuyPage(props: PageProps<"/kup">) {
  const searchParams = await props.searchParams;
  const session = await getCurrentAccessSession();
  const courses = await getPublishedCourses();
  const accessibleCourses = session
    ? await getAccessibleCourses(session.userId, session.role === "admin")
    : [];
  const ownedCourseIds = new Set(accessibleCourses.map((course) => course.id));
  const selectedSlug =
    typeof searchParams.course === "string" ? searchParams.course : undefined;

  return (
    <section className="checkout-page">
      <div className="container-main">
        <BackHomeLink />

        <header className="purchase-header">
          <span className="eyebrow">Jednorazowy dostęp</span>
          <h1>Wybierz kurs i ucz się we własnym tempie.</h1>
          <p>
            Każdy zakup przypisujemy do konta. Otrzymujesz lekcje wideo,
            uporządkowane moduły, własne notatki i zapis postępu bez abonamentu.
          </p>
        </header>

        {!session ? (
          <div className="purchase-account-bar">
            <div>
              <strong>Do zakupu potrzebne jest konto</strong>
              <span>
                Zaloguj się lub utwórz konto, aby zachować dostęp do materiałów.
              </span>
            </div>
            <div className="purchase-account-bar__actions">
              <Link href="/logowanie?next=/kup" className="button-primary">
                Zaloguj się
              </Link>
              <Link href="/rejestracja?next=/kup" className="button-secondary">
                Utwórz konto
              </Link>
            </div>
          </div>
        ) : (
          <div className="purchase-account-bar purchase-account-bar--active">
            <div>
              <strong>Kupujesz jako {session.email}</strong>
              <span>Dostęp pojawi się na tym koncie po potwierdzeniu wpłaty.</span>
            </div>
            <Link href="/panel" className="button-secondary">
              Przejdź do panelu
            </Link>
          </div>
        )}

        <CourseCheckout
          courses={courses.map((course) => ({
            id: course.id,
            slug: course.slug,
            title: course.title,
            description: course.description,
            duration: course.duration,
            level: course.level,
            modules: course.modules,
            price: formatCoursePrice(course),
            priceCents: course.priceCents,
            salesEnabled: course.salesEnabled,
            owned: ownedCourseIds.has(course.id),
          }))}
          selectedSlug={selectedSlug}
          isAuthenticated={Boolean(session)}
          paymentsEnabled={isP24Enabled()}
        />

        <section className="purchase-includes" aria-labelledby="purchase-includes-title">
          <div>
            <p className="checkout-plan__name">W cenie kursu</p>
            <h2 id="purchase-includes-title">
              Materiały przypisane do Twojego konta
            </h2>
          </div>
          <div className="purchase-includes__grid">
            <div>
              <strong>Lekcje wideo</strong>
              <span>Filmy podzielone na krótkie, uporządkowane moduły.</span>
            </div>
            <div>
              <strong>Notatki i postęp</strong>
              <span>Własne zapiski oraz zapis ukończonych lekcji.</span>
            </div>
            <div>
              <strong>Materiały kursowe</strong>
              <span>Podsumowania i zadania przypisane do zakupionego kursu.</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
