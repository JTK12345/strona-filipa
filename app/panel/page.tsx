import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { accessCookieName, parseAccessToken } from "@/app/api/_utils/access-session";
import { coursePaths } from "@/content/courses";

export const metadata: Metadata = {
  title: "Panel kursów | Świadomy Profil Ciała",
  description: "Panel dostępu do kursów i materiałów premium.",
};

export default async function PanelPage(props: PageProps<"/panel">) {
  const cookieStore = await cookies();
  const session = parseAccessToken(cookieStore.get(accessCookieName)?.value);
  const searchParams = await props.searchParams;

  if (!session) {
    return (
      <section className="panel-page">
        <div className="container-main">
          <div className="panel-empty">
            <span className="eyebrow">Panel kursów</span>
            <h1>Najpierw zaloguj się albo kup dostęp testowo.</h1>
            <p>
              Ten panel jest chroniony ciasteczkiem sesji. Dostęp może nadać zakup testowy
              albo kod administratora.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/logowanie" className="button-primary">
                Logowanie
              </Link>
              <Link href="/kup" className="button-secondary">
                Kup dostęp
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-page">
      <div className="container-main">
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
