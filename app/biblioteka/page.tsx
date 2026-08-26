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
    <section className="library-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="library-heading">
          <span className="eyebrow">Twoje materiały</span>
          <h1>Filmy, instrukcje i pliki do pracy własnej.</h1>
        </div>

        <div className="library-topics" aria-label="Tematy materiałów">
          {libraryTopics.map((topic) => (
            <span key={topic} className="topic-chip">
              {topic}
            </span>
          ))}
        </div>

        {items.length > 0 ? (
          <div className="library-list">
            {items.map((item) => (
              <article key={item.id} className="library-card">
                <div className="library-card__copy">
                  <p>{item.itemType === "video" ? "Film" : item.itemType === "file" ? "Plik" : "Instrukcja"}</p>
                  <h2>{item.title}</h2>
                  {item.summary ? <span>{item.summary}</span> : null}
                  {item.contentMarkdown ? <small>{item.contentMarkdown}</small> : null}
                </div>
                <div className="library-card__actions">
                  {item.videoStorageKey ? (
                    <video
                      className="library-video"
                      controls
                      preload="metadata"
                      src={`/api/library-items/${item.id}/media?kind=video`}
                    />
                  ) : null}
                  {item.videoStorageKey ? (
                    <a
                      href={`/api/library-items/${item.id}/media?kind=video`}
                      className="button-secondary"
                    >
                      Obejrzyj materiał
                    </a>
                  ) : null}
                  {item.attachmentStorageKey ? (
                    <Link
                      href={`/api/library-items/${item.id}/media?kind=attachment`}
                      className="button-secondary"
                    >
                      Pobierz plik
                    </Link>
                  ) : null}
                  {!item.videoStorageKey && !item.attachmentStorageKey ? (
                    <span className="library-note-label">Otwórz materiał</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="library-empty">
            <h2>Nie ma jeszcze opublikowanych materiałów.</h2>
            <p>Wróć tutaj po konsultacji albo sprawdź swój panel później.</p>
          </div>
        )}
      </div>
    </section>
  );
}
