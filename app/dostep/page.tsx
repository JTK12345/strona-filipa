import type { Metadata } from "next";
import Link from "next/link";
import { accessFeatures } from "@/content/courses";

export const metadata: Metadata = {
  title: "Dostęp | Świadomy Profil Ciała",
  description: "Model dostępu do kursów wideo i materiałów premium.",
};

export default function AccessPage() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <div className="access-layout">
          <div>
            <span className="eyebrow">Panel dostępu</span>
            <h1 className="section-title max-w-4xl">
              Tu docelowo pojawi się logowanie, płatność i lista wykupionych kursów.
            </h1>
            <p className="section-lead">
              Ten ekran jest przygotowany jako miejsce pod paywall. Na kolejnym etapie
              można podłączyć operatora płatności, konta użytkowników i ochronę lekcji wideo.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/kursy" className="button-primary">
                Wróć do kursów
              </Link>
              <Link href="/#kontakt" className="button-secondary">
                Zapytaj o dostęp
              </Link>
            </div>
          </div>

          <aside className="access-card">
            <p className="text-sm font-bold uppercase text-[var(--accent)]">Co będzie za paywallem</p>
            <div className="mt-6 grid gap-3">
              {accessFeatures.map((feature) => (
                <p key={feature} className="check-row">{feature}</p>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
