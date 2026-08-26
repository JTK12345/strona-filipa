import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getCourseAccessCta } from "@/app/lib/course-access-cta";
import {
  getAccessibleCourses,
  getCourseStatusLabel,
  getPublishedCourses,
} from "@/app/lib/courses";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Kursy wideo | Świadomy Profil Ciała",
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
  const accessibleSlugs = new Set(accessibleCourses.map((course) => course.slug));

  return (
    <section className="section bg-white">
      <div className="container-main">
        <BackHomeLink />
        <div className="page-hero">
          <span className="eyebrow">Materiały online</span>
          <h1 className="section-title max-w-4xl">
            Materiały edukacyjne do pracy z ciałem, dostępne po wpisaniu kodu.
          </h1>
          <p className="section-lead">
            Materiały online są dodatkiem do konsultacji, treningów i pakietów
            współpracy. Po aktywacji kodu pojawią się w Twoim panelu.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {courses.map((course) => (
            <article key={course.slug} className="course-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="price-pill">{getCourseStatusLabel(course)}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--muted)]">
                    {course.duration}
                  </p>
                  <p className="mt-1 font-bold">Kod dostępu</p>
                </div>
              </div>
              <h2 className="mt-6 text-2xl font-bold leading-tight">{course.title}</h2>
              <p className="mt-4 leading-7 text-[var(--muted)]">{course.description}</p>
              <div className="mt-6 grid gap-2 text-sm text-[var(--muted)]">
                {course.modules.map((module) => (
                  <p key={module} className="check-row">{module}</p>
                ))}
              </div>
              <Link
                href={
                  getCourseAccessCta({
                    slug: course.slug,
                    isLoggedIn: Boolean(session),
                    hasAccess: accessibleSlugs.has(course.slug),
                  }).href
                }
                className="button-primary mt-8 w-full"
              >
                {
                  getCourseAccessCta({
                    slug: course.slug,
                    isLoggedIn: Boolean(session),
                    hasAccess: accessibleSlugs.has(course.slug),
                  }).label
                }
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
