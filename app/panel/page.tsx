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
  title: "Panel materiałów | Świadomy Profil Ciała",
  description: "Panel dostępu do kursów, filmów i materiałów edukacyjnych.",
};

export default async function PanelPage() {
  const session = await getCurrentAccessSession();

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
            <span className="eyebrow">Panel materiałów</span>
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
            <a href="#moje-kursy">Moje materiały</a>
            <Link href="/dostep">Wpisz kod</Link>
            {session.hasLibraryAccess ? (
              <Link href="/biblioteka">Biblioteka</Link>
            ) : null}
            {session.role === "admin" ? (
              <Link href="/panel/admin/kody">Administracja</Link>
            ) : null}
          </aside>

          <div className="panel-content">
            <section id="moje-kursy">
              <div className="panel-section-heading">
                <div>
                  <p className="checkout-plan__name">Dostępne materiały</p>
                  <h2>Moje kursy i materiały</h2>
                </div>
                <Link href="/kursy" className="button-secondary">
                  Katalog materiałów
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
                  <h2>Nie masz jeszcze aktywowanego kodu.</h2>
                  <p>
                    Wpisz kod otrzymany od administratora. Po aktywacji
                    materiały pojawią się tutaj automatycznie.
                  </p>
                  <Link href="/dostep" className="button-primary">
                    Wpisz kod
                  </Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
