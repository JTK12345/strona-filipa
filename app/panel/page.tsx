import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAccessSession } from "@/app/lib/access";
import { BackHomeLink } from "@/components/BackHomeLink";
import { coursePaths } from "@/content/courses";

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
              <strong>{session.role === "admin" ? "admin" : "użytkownik testowy"}</strong>.
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

        <div className="panel-layout">
          <aside className="panel-sidebar">
            <p>Moje kursy</p>
            <p>Biblioteka</p>
            <p>Notatki</p>
            <p>Ustawienia</p>
          </aside>

          <div className="panel-courses">
            {coursePaths.map((course, index) => (
              <article key={course.slug} className="panel-course-card">
                <div>
                  <p className="checkout-plan__name">{course.status}</p>
                  <h2>{course.title}</h2>
                  <span>{course.duration} · {course.level}</span>
                </div>
                <p>{course.description}</p>
                <div className="access-progress-bar">
                  <span style={{ width: `${index === 0 ? 62 : 12}%` }} />
                </div>
                <button className="button-primary" type="button">
                  Otwórz kurs
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
