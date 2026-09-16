import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getAccessibleCourses, getPublishedCourses } from "@/app/lib/courses";
import { BackHomeLink } from "@/components/BackHomeLink";
import { PanelBackNavigation } from "@/components/PanelBackNavigation";
import { AcademyCard } from "@/components/sections/Academy";
import styles from "@/components/sections/landing.module.css";

export const metadata: Metadata = {
  title: "Kursy dla subskrybentów | Świadomy Profil Ciała",
  description: "Programy wideo o ruchu, bólu, mobilności i regeneracji.",
};

export default async function CoursesPage() {
  const session = await getCurrentAccessSession();
  const [courses, accessibleCourses] = await Promise.all([
    getPublishedCourses(),
    session
      ? getAccessibleCourses(session.userId, session.role === "admin")
      : Promise.resolve([]),
  ]);
  const accessibleSlugs = new Set(
    accessibleCourses.map((course) => course.slug),
  );
  return (
    <div className={styles.theme}>
      <section className="section">
        <div className="container-main">
          {session ? <PanelBackNavigation /> : <BackHomeLink />}
          <div className="page-hero">
            <span className="eyebrow">Akademia zdrowia</span>
            <h1 className="section-title">
              Wiedza, do której wracasz.
              <br />
              Zdrowie na co dzień.
            </h1>
            <p className="section-lead">
              Kursy online są dodatkiem do konsultacji, treningów i pakietów
              współpracy. Po aktywacji kodu pojawią się w Twoim panelu.
            </p>
          </div>
        </div>
      </section>
      <section className={styles.academy}>
        <div className={`${styles.wrap} ${styles.catalogBody}`}>
          <span className={styles.eyebrow}>Kursy dla subskrybentów</span>
          <h2 className={styles.title}>Wybierz swój kierunek.</h2>
          <div className={styles.academyGrid}>
            {courses.map((course) => (
              <AcademyCard
                key={course.id}
                course={course}
                loggedIn={Boolean(session)}
                hasAccess={accessibleSlugs.has(course.slug)}
              />
            ))}
          </div>
          {courses.length === 0 && (
            <p>Nowe programy pojawią się tutaj po publikacji.</p>
          )}
          <div className={styles.academyLinks}>
            <Link href="/dostep">Mam kod dostępu ↗</Link>
            <Link href="/biblioteka">Biblioteka materiałów ↗</Link>
            {session && <Link href="/panel">Moje kursy ↗</Link>}
          </div>
        </div>
      </section>
    </div>
  );
}
