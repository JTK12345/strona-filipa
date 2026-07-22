import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccessSession } from "@/app/lib/access";
import { libraryTopics } from "@/content/courses";

const examples = [
  {
    title: "Szybka rutyna przy pracy siedzącej",
    type: "materiał wideo",
    access: "dla zalogowanych",
  },
  {
    title: "Jak rozpoznać, czy problemem jest mobilność czy kontrola ruchu",
    type: "lekcja edukacyjna",
    access: "dla zalogowanych",
  },
  {
    title: "Oddech, żebra i napięcie w górnych plecach",
    type: "moduł praktyczny",
    access: "dla zalogowanych",
  },
];

export const metadata: Metadata = {
  title: "Biblioteka | Świadomy Profil Ciała",
  description: "Biblioteka materiałów o zdrowiu, ruchu, bólu i regeneracji.",
};

export default async function LibraryPage() {
  const session = await getCurrentAccessSession();

  if (!session) {
    redirect("/logowanie?next=/biblioteka");
  }

  return (
    <section className="section">
      <div className="container-main">
        <div className="page-hero">
          <span className="eyebrow">Biblioteka zdrowia i ruchu</span>
          <h1 className="section-title max-w-4xl">
            Miejsce na krótsze materiały, które uzupełniają kursy i konsultacje.
          </h1>
          <p className="section-lead">
            Biblioteka działa jak mapa tematów: pomaga znaleźć właściwą lekcję,
            notatkę albo materiał praktyczny w ramach aktywnego dostępu.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {libraryTopics.map((topic) => (
            <span key={topic} className="topic-chip">
              {topic}
            </span>
          ))}
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {examples.map((item) => (
            <article key={item.title} className="library-card">
              <p className="text-sm font-bold uppercase text-[var(--accent)]">{item.type}</p>
              <h2 className="mt-4 text-2xl font-bold leading-tight">{item.title}</h2>
              <p className="mt-5 text-sm font-semibold text-[var(--muted)]">{item.access}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 premium-panel">
          <div>
            <span className="eyebrow">Twój dostęp</span>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              Biblioteka, notatki i materiały wideo są dostępne po zalogowaniu.
            </h2>
          </div>
          <Link href="/panel" className="button-primary">
            Wróć do panelu
          </Link>
        </div>
      </div>
    </section>
  );
}
