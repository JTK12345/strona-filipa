import Link from "next/link";
import { getCurrentAccessSession } from "@/app/lib/access";
import {
  getAccessibleCourses,
  getPublishedCourses,
  getCourseStatusLabel,
  type CourseCatalogItem,
} from "@/app/lib/courses";
import { getCourseAccessCta } from "@/app/lib/course-access-cta";
import styles from "./landing.module.css";
export function AcademyCard({
  course,
  loggedIn,
  hasAccess,
}: {
  course: CourseCatalogItem;
  loggedIn: boolean;
  hasAccess: boolean;
}) {
  const cta = getCourseAccessCta({
    slug: course.slug,
    isLoggedIn: loggedIn,
    hasAccess,
  });
  return (
    <article className={styles.academyCard}>
      {/* TODO: replace the neutral cover when the course catalog supports thumbnails. */}
      <Link
        href={cta.href}
        className={styles.courseCover}
        aria-label={`${cta.label}: ${course.title}`}
      >
        <span className={styles.eyebrow}>Akademia zdrowia</span>
        <span className={styles.coverTitle}>{course.title}</span>
        <span className={styles.play} aria-hidden="true">
          ▶
        </span>
      </Link>
      <div className={styles.courseBody}>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <p>
          {course.duration}
          {course.level ? ` · ${course.level}` : ""}
        </p>
        <details className={styles.courseModules}>
          <summary>Program kursu ({course.modules.length})</summary>
          <ul>
            {course.modules.map((module, index) => (
              <li key={`${module}-${index}`}>{module}</li>
            ))}
          </ul>
        </details>
        <div className={styles.academyFoot}>
          <span>
            {hasAccess ? "Masz dostęp" : getCourseStatusLabel(course)}
          </span>
          <Link href={cta.href}>
            {cta.label} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
export async function Academy() {
  const session = await getCurrentAccessSession();
  const [courses, accessible] = await Promise.all([
    getPublishedCourses(),
    session
      ? getAccessibleCourses(session.userId, session.role === "admin")
      : Promise.resolve([]),
  ]);
  const slugs = new Set(accessible.map((course) => course.slug));
  return (
    <section id="akademia" className={`${styles.section} ${styles.academy}`}>
      <div className={styles.wrap}>
        <span className={styles.eyebrow}>Biblioteka zaleceń lekarza</span>
        <h2 className={styles.title}>Akademia Zdrowia</h2>
        <p className={styles.academyIntro}>
          Materiały wideo stworzone przez lekarza, które pomagają wdrożyć
          zalecenia w codziennym życiu. Kursy przypisane do Twojego konta oraz
          programy dostępne po aktywacji kodu.
        </p>
        <div className={styles.academyGrid}>
          {courses.map((course) => (
            <AcademyCard
              key={course.id}
              course={course}
              loggedIn={Boolean(session)}
              hasAccess={slugs.has(course.slug)}
            />
          ))}
        </div>
        {courses.length === 0 && (
          <p>Nowe programy pojawią się tutaj po publikacji.</p>
        )}
        <div className={styles.academyLinks}>
          <Link href="/kursy">Wszystkie kursy ↗</Link>
          <Link href="/biblioteka">Biblioteka materiałów ↗</Link>
          <Link href={session ? "/dostep" : "/logowanie"}>
            {session ? "Aktywuj kod dostępu" : "Zaloguj się"} ↗
          </Link>
        </div>
      </div>
    </section>
  );
}
