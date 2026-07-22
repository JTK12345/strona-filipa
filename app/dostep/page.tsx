import type { Metadata } from "next";
import Link from "next/link";
import { accessFeatures, coursePaths, premiumAccessBlocks } from "@/content/courses";

export const metadata: Metadata = {
  title: "Dostęp premium | Świadomy Profil Ciała",
  description: "Dostęp premium do kursów wideo i biblioteki ruchu.",
};

export default function AccessPage() {
  return (
    <section className="access-premium-page">
      <div className="container-main">
        <div className="access-premium-hero">
          <div className="access-premium-copy">
            <span className="eyebrow">Dostęp premium</span>
            <h1>Dostęp do kursów i biblioteki świadomej pracy z ciałem.</h1>
            <p>
              Programy wideo, krótkie lekcje i materiały do samodzielnej praktyki.
              Dla osób, które chcą ćwiczyć świadomie między wizytami albo zacząć
              od edukacji online.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/#kontakt" className="button-primary">
                Chcę dostać informację o starcie
              </Link>
              <Link href="/kursy" className="button-secondary">
                Zobacz kursy
              </Link>
            </div>
          </div>

          <aside className="access-dashboard">
            <div className="access-dashboard__top">
              <div>
                <p className="access-dashboard__label">Twój dostęp</p>
                <h2>Panel kursów</h2>
              </div>
              <span>Wkrótce</span>
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
            <span className="eyebrow">Jak będzie działać dostęp</span>
            <h2>Od wyboru kursu do pracy z materiałami w panelu.</h2>
          </div>
          <div className="access-roadmap__steps">
            <p><strong>1.</strong> Wybierasz kurs albo pakiet biblioteki.</p>
            <p><strong>2.</strong> Po płatności konto dostaje dostęp do materiałów.</p>
            <p><strong>3.</strong> Oglądasz lekcje, wracasz do notatek i realizujesz zadania.</p>
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
