import Link from "next/link";
import { services } from "@/content/services";
import { coursePaths } from "@/content/courses";

export function Services() {
  return (
    <section id="uslugi" className="section bg-white">
      <div className="container-main">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Oferta</span>
            <h2 className="section-title max-w-3xl">
              Współpraca 1:1 i kursy wideo jako dwa produkty jednej marki.
            </h2>
          </div>
          <Link href="/kursy" className="button-secondary">
            Wszystkie kursy
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {services.map((service) => (
            <article key={service.title} className="offer-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h3 className="text-2xl font-semibold">{service.title}</h3>
                <span className="price-pill">{service.price}</span>
              </div>
              <p className="mt-4 leading-7 text-[var(--muted)]">{service.description}</p>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--muted)]">
                {service.bullets.map((bullet) => (
                  <li key={bullet} className="check-row">{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-12 premium-panel">
          <div>
            <span className="eyebrow">Kursy za paywallem</span>
            <h3 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
              Programy wideo do pracy między wizytami albo jako samodzielna ścieżka.
            </h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {coursePaths.map((course) => (
              <article key={course.slug} className="course-mini-card">
                <p className="text-sm font-bold text-[var(--accent)]">{course.status}</p>
                <h4 className="mt-3 text-xl font-bold">{course.title}</h4>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{course.description}</p>
                <p className="mt-5 text-sm font-bold">{course.duration} · {course.level}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
