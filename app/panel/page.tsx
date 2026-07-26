import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccessSession } from "@/app/lib/access";
import {
  getAccessibleCourses,
  getCourseStatusLabel,
} from "@/app/lib/courses";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Panel kursów | Świadomy Profil Ciała",
  description: "Panel dostępu do kursów i materiałów premium.",
};

export default async function PanelPage(props: PageProps<"/panel">) {
  const session = await getCurrentAccessSession();
  const searchParams = await props.searchParams;

  if (!session) {
    redirect("/logowanie?next=/panel");
  }

  const courses = await getAccessibleCourses(
    session.userId,
    session.role === "admin",
  );

  return (
    <section className="panel-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="panel-topbar">
          <div>
            <span className="eyebrow">Panel kursów</span>
            <h1>Twoje materiały premium</h1>
            <p>
              Zalogowano jako <strong>{session.email}</strong>. Rola:{" "}
              <strong>{session.role === "admin" ? "administrator" : "użytkownik"}</strong>.
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button type="submit" className="button-secondary">
              Wyloguj
            </button>
          </form>
        </div>

        {searchParams.purchase === "success" ? (
          <div className="panel-alert">Dostęp testowy został aktywowany.</div>
        ) : null}

        {!session.hasAnyAccess ? (
          <div className="panel-empty">
            <span className="eyebrow">Brak aktywnego dostępu</span>
            <h2>Konto jest aktywne, ale nie masz jeszcze wykupionych materiałów.</h2>
            <p>
              Wybierz kurs lub pakiet biblioteki. Po aktywacji zakupione materiały
              pojawią się tutaj automatycznie.
            </p>
            <Link href="/kup" className="button-primary">
              Zobacz opcje dostępu
            </Link>
          </div>
        ) : (
          <div className="panel-layout">
            <aside className="panel-sidebar">
              <p>Moje kursy</p>
              <p>Biblioteka</p>
              <p>Notatki</p>
              <p>Ustawienia</p>
            </aside>

            <div className="panel-courses">
              {courses.length > 0 ? (
                courses.map((course) => (
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
                ))
              ) : (
                <div className="panel-empty">
                  <span className="eyebrow">Brak przypisanych kursów</span>
                  <h2>Masz aktywny dostęp, ale nie przypisano do niego kursu.</h2>
                  <p>
                    Dostęp do biblioteki nadal działa. Zakupione kursy pojawią się
                    tutaj automatycznie.
                  </p>
                  <Link href="/biblioteka" className="button-primary">
                    Otwórz bibliotekę
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
