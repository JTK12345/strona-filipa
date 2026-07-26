import type { Metadata } from "next";
import Link from "next/link";
import {
  formatCoursePrice,
  getCourseStatusLabel,
  getPublishedCourses,
} from "@/app/lib/courses";
import { BackHomeLink } from "@/components/BackHomeLink";
import { accessFeatures, premiumAccessBlocks } from "@/content/courses";

export const metadata: Metadata = {
  title: "Dostęp premium | Świadomy Profil Ciała",
  description: "Dostęp premium do kursów wideo i biblioteki ruchu.",
};

export default async function AccessPage() {
  const courses = await getPublishedCourses();
  const featuredCourse = courses[0];

  return (
    <section className="access-premium-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="access-premium-hero">
          <div className="access-premium-copy">
            <span className="eyebrow">Dostęp premium</span>
            <h1>Dostęp do kursów i biblioteki świadomej pracy z ciałem.</h1>
            <p>
              Programy wideo, krótkie lekcje i materiały do samodzielnej praktyki.
              Załóż konto, wybierz dostęp i korzystaj z przypisanych materiałów
              po bezpiecznym zalogowaniu.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/kup" className="button-primary">
                Kup dostęp
              </Link>
              <Link href="/logowanie" className="button-secondary">
                Zaloguj się
              </Link>
              <Link href="/panel" className="button-secondary">
                Otwórz panel
              </Link>
            </div>
          </div>

          <aside className="access-dashboard">
            <div className="access-dashboard__top">
              <div>
                <p className="access-dashboard__label">Twój dostęp</p>
                <h2>Panel kursów</h2>
              </div>
              <span>Konto</span>
            </div>

            <div className="access-dashboard__progress">
              <div>
                <p>{featuredCourse?.title ?? "Pierwszy kurs"}</p>
                <span>{featuredCourse?.duration ?? "Materiały w przygotowaniu"}</span>
              </div>
              <progress
                className="access-progress-bar"
                value={62}
                max={100}
                aria-label="Przykładowy postęp kursu: 62 procent"
              />
            </div>

            <div className="access-dashboard__list">
              {accessFeatures.map((feature) => (
                <p key={feature} className="check-row">{feature}</p>
              ))}
            </div>
          </aside>
        </div>

        <div className="access-premium-grid">
          {premiumAccessBlocks.map((block) => (
            <article key={block.title} className="access-value-card">
              <h2>{block.title}</h2>
              <p>{block.description}</p>
            </article>
          ))}
        </div>

        <div className="access-roadmap">
          <div>
            <span className="eyebrow">Jak działa teraz</span>
            <h2>Konto łączy zakup, postęp i materiały w jednym miejscu.</h2>
          </div>
          <div className="access-roadmap__steps">
            <p><strong>1.</strong> Rejestracja tworzy konto chronione hasłem.</p>
            <p><strong>2.</strong> Po płatności Przelewy24 potwierdza transakcję i aktywuje zakupiony kurs.</p>
            <p><strong>3.</strong> Biblioteka jest dostępna tylko dla kont z odpowiednim uprawnieniem.</p>
          </div>
        </div>

        <div className="access-course-strip">
          {courses.map((course) => (
            <article key={course.slug}>
              <p>{getCourseStatusLabel(course)}</p>
              <h3>{course.title}</h3>
              <span>
                {course.duration} · {course.level} · {formatCoursePrice(course)}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
