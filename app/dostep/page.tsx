import type { Metadata } from "next";
import Link from "next/link";
import { BackHomeLink } from "@/components/BackHomeLink";
import { accessFeatures, coursePaths, premiumAccessBlocks } from "@/content/courses";

export const metadata: Metadata = {
  title: "Dostęp premium | Świadomy Profil Ciała",
  description: "Dostęp premium do kursów wideo i biblioteki ruchu.",
};

export default function AccessPage() {
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
              Możesz kupić dostęp testowo albo wejść jako admin kodem z `.env`.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/kup" className="button-primary">
                Kup dostęp
              </Link>
              <Link href="/logowanie" className="button-secondary">
                Logowanie admina
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
              <span>Test</span>
            </div>

            <div className="access-dashboard__progress">
              <div>
                <p>Kręgosłup bez przeciążeń</p>
                <span>4 moduły</span>
              </div>
              <div className="access-progress-bar">
                <span style={{ width: "62%" }} />
              </div>
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
            <h2>Gotowy testowy przepływ przed Stripe i pełnym logowaniem.</h2>
          </div>
          <div className="access-roadmap__steps">
            <p><strong>1.</strong> `Kup dostęp` nadaje testową sesję klienta bez pobierania płatności.</p>
            <p><strong>2.</strong> `Logowanie admina` wpuszcza kodem z `.env` bez konieczności zakupu.</p>
            <p><strong>3.</strong> `Panel` pokazuje materiały tylko po aktywnej sesji.</p>
          </div>
        </div>

        <div className="access-course-strip">
          {coursePaths.map((course) => (
            <article key={course.slug}>
              <p>{course.status}</p>
              <h3>{course.title}</h3>
              <span>{course.duration} · {course.level}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
