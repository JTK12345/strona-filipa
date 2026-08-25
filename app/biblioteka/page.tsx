import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getPublishedLibraryItems } from "@/app/lib/library";
import { BackHomeLink } from "@/components/BackHomeLink";
import { libraryTopics } from "@/content/courses";

export const metadata: Metadata = {
  title: "Biblioteka | Świadomy Profil Ciała",
  description: "Biblioteka materiałów o zdrowiu, ruchu, bólu i regeneracji.",
};

export default async function LibraryPage() {
  const session = await getCurrentAccessSession();

  if (!session) {
    redirect("/logowanie?next=/biblioteka");
  }

  if (!session.hasLibraryAccess) {
    redirect("/dostep?required=1");
  }

  const items = await getPublishedLibraryItems();

  return (
    <section className="section">
      <div className="container-main">
        <BackHomeLink />
        <div className="page-hero">
          <span className="eyebrow">Biblioteka zdrowia i ruchu</span>
          <h1 className="section-title max-w-4xl">
            Materiały wideo, instrukcje i pliki dodane przez administratora.
          </h1>
          <p className="section-lead">
            Biblioteka pokazuje opublikowane materiały dla kont z aktywnym
            kodem dostępu.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {libraryTopics.map((topic) => (
            <span key={topic} className="topic-chip">
              {topic}
            </span>
          ))}
        </div>

        {items.length > 0 ? (
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="library-card">
                <p className="text-sm font-bold uppercase text-[var(--accent)]">
                  {item.itemType}
                </p>
                <h2 className="mt-4 text-2xl font-bold leading-tight">
                  {item.title}
                </h2>
                {item.summary ? (
                  <p className="mt-4 text-sm text-[var(--muted)]">
                    {item.summary}
                  </p>
                ) : null}
                {item.contentMarkdown ? (
                  <p className="mt-5 whitespace-pre-line text-sm leading-6 text-[var(--foreground)]">
                    {item.contentMarkdown}
                  </p>
                ) : null}
                {item.videoStorageKey ? (
                  <video
                    className="mt-5 w-full rounded-[8px]"
                    controls
                    preload="metadata"
                    src={`/api/library-items/${item.id}/media?kind=video`}
                  />
                ) : null}
                {item.attachmentStorageKey ? (
                  <Link
                    href={`/api/library-items/${item.id}/media?kind=attachment`}
                    className="button-secondary mt-5"
                  >
                    Pobierz plik
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="panel-empty panel-empty--compact mt-12">
            <span className="eyebrow">Biblioteka</span>
            <h2>Nie ma jeszcze opublikowanych materiałów.</h2>
            <p>Materiały pojawią się tutaj po dodaniu ich w panelu admina.</p>
          </div>
        )}

        <div className="mt-12 premium-panel">
          <div>
            <span className="eyebrow">Twój dostęp</span>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              Biblioteka jest dostępna po zalogowaniu i aktywacji kodu.
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
