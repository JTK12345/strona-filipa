import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getUserPurchaseHistory } from "@/app/lib/account";
import {
  getAccessibleCourses,
  getCourseStatusLabel,
} from "@/app/lib/courses";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Panel kursów | Świadomy Profil Ciała",
  description: "Panel dostępu do kursów i materiałów premium.",
};

const purchaseStatusLabels = {
  pending: "Oczekuje",
  paid: "Opłacone",
  failed: "Nieudane",
  cancelled: "Anulowane",
  refunded: "Zwrócone",
  expired: "Wygasło",
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
  }).format(value);
}

function formatAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export default async function PanelPage() {
  const session = await getCurrentAccessSession();

  if (!session) {
    redirect("/logowanie?next=/panel");
  }

  const [courses, purchases] = await Promise.all([
    getAccessibleCourses(session.userId, session.role === "admin"),
    getUserPurchaseHistory(session.userId),
  ]);

  return (
    <section className="panel-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="panel-topbar">
          <div>
            <span className="eyebrow">Panel kursów</span>
            <h1>Twoje materiały</h1>
            <p>
              Zalogowano jako <strong>{session.email}</strong>.
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button type="submit" className="button-secondary">
              Wyloguj
            </button>
          </form>
        </div>

        <div className="panel-layout">
          <aside className="panel-sidebar">
            <a href="#moje-kursy">Moje kursy</a>
            <a href="#zamowienia">Zamówienia</a>
            {session.hasLibraryAccess ? (
              <Link href="/biblioteka">Biblioteka</Link>
            ) : null}
            {session.role === "admin" ? (
              <Link href="/panel/admin">Administracja</Link>
            ) : null}
          </aside>

          <div className="panel-content">
            <section id="moje-kursy">
              <div className="panel-section-heading">
                <div>
                  <p className="checkout-plan__name">Dostępne materiały</p>
                  <h2>Moje kursy</h2>
                </div>
                <Link href="/kursy" className="button-secondary">
                  Katalog kursów
                </Link>
              </div>

              {courses.length > 0 ? (
                <div className="panel-courses">
                  {courses.map((course) => (
                    <article key={course.slug} className="panel-course-card">
                      <div>
                        <p className="checkout-plan__name">
                          {getCourseStatusLabel(course)}
                        </p>
                        <h2>{course.title}</h2>
                        <span>
                          {course.duration} · {course.level}
                        </span>
                      </div>
                      <p>{course.description}</p>
                      <Link
                        href={`/panel/kursy/${course.slug}`}
                        className="button-primary"
                      >
                        Przejdź do kursu
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="panel-empty panel-empty--compact">
                  <span className="eyebrow">Brak aktywnego dostępu</span>
                  <h2>Nie masz jeszcze wykupionego kursu.</h2>
                  <p>
                    Po potwierdzeniu płatności zakupione materiały pojawią się
                    tutaj automatycznie.
                  </p>
                  <Link href="/kup" className="button-primary">
                    Zobacz kursy
                  </Link>
                </div>
              )}
            </section>

            <section id="zamowienia" className="account-orders">
              <div className="panel-section-heading">
                <div>
                  <p className="checkout-plan__name">Historia konta</p>
                  <h2>Zamówienia</h2>
                </div>
              </div>
              {purchases.length > 0 ? (
                <div className="account-order-list">
                  {purchases.map((purchase) => (
                    <article
                      key={purchase.publicOrderNumber}
                      className="account-order"
                    >
                      <div>
                        <strong>{purchase.courseTitle}</strong>
                        <span>
                          {purchase.publicOrderNumber} ·{" "}
                          {formatDate(purchase.createdAt)}
                        </span>
                      </div>
                      <div className="account-order__amount">
                        <strong>
                          {formatAmount(
                            purchase.amountCents,
                            purchase.currency,
                          )}
                        </strong>
                        <span
                          className={`status-badge status-badge--${purchase.status}`}
                        >
                          {purchaseStatusLabels[purchase.status]}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="account-orders__empty">
                  Na tym koncie nie ma jeszcze zamówień.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
