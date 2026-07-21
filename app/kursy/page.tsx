import type { Metadata } from "next";
import Link from "next/link";
import { coursePaths } from "@/content/courses";

export const metadata: Metadata = {
  title: "Kursy wideo | Świadomy Profil Ciała",
  description: "Programy wideo o ruchu, bólu, mobilności i regeneracji.",
};

export default function CoursesPage() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <div className="page-hero">
          <span className="eyebrow">Kursy wideo</span>
          <h1 className="section-title max-w-4xl">
            Programy do samodzielnej pracy z ciałem, dostępne po wykupieniu dostępu.
          </h1>
          <p className="section-lead">
            Każdy kurs będzie ułożony w moduły: krótka edukacja, lekcje wideo,
            praktyka i zadania do wdrożenia między treningami albo wizytami.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {coursePaths.map((course) => (
            <article key={course.slug} className="course-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="price-pill">{course.status}</span>
                <span className="text-sm font-bold text-[var(--muted)]">{course.duration}</span>
              </div>
              <h2 className="mt-6 text-2xl font-bold leading-tight">{course.title}</h2>
              <p className="mt-4 leading-7 text-[var(--muted)]">{course.description}</p>
              <div className="mt-6 grid gap-2 text-sm text-[var(--muted)]">
                {course.lessons.map((lesson) => (
                  <p key={lesson} className="check-row">{lesson}</p>
                ))}
              </div>
              <Link href="/dostep" className="button-primary mt-8 w-full">
                Sprawdź dostęp
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
