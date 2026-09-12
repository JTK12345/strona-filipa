import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getAccessibleLibraryItems } from "@/app/lib/library";
import { PanelBackNavigation } from "@/components/PanelBackNavigation";
import { libraryTopics } from "@/content/courses";

export const metadata: Metadata = {
  title: "Biblioteka materiałów | Świadomy Profil Ciała",
  description: "Biblioteka materiałów o zdrowiu, ruchu, bólu i regeneracji.",
};

const itemTypeLabels = {
  all: "Wszystkie",
  video: "Filmy",
  file: "Pliki",
  note: "Instrukcje",
};

function normalizeFilter(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function itemMatchesTopic(
  item: Awaited<ReturnType<typeof getAccessibleLibraryItems>>[number],
  topic: string,
) {
  if (!topic) {
    return true;
  }

  const haystack = `${item.title} ${item.summary} ${item.contentMarkdown}`.toLowerCase();
  return haystack.includes(topic.toLowerCase());
}

export default async function LibraryPage(props: PageProps<"/biblioteka">) {
  const [session, searchParams] = await Promise.all([
    getCurrentAccessSession(),
    props.searchParams,
  ]);

  if (!session) {
    redirect("/logowanie?next=/biblioteka");
  }

  const items = await getAccessibleLibraryItems(
    session.userId,
    session.role === "admin",
    session.hasLibraryAccess,
  );
  const query = normalizeFilter(searchParams.q).toLowerCase();
  const selectedType = normalizeFilter(searchParams.typ);
  const selectedTopic = normalizeFilter(searchParams.temat);
  const normalizedType = selectedType in itemTypeLabels ? selectedType : "all";
  const filteredItems = items.filter((item) => {
    const haystack = `${item.title} ${item.summary} ${item.contentMarkdown}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesType = normalizedType === "all" || item.itemType === normalizedType;

    return matchesQuery && matchesType && itemMatchesTopic(item, selectedTopic);
  });

  return (
    <section className="library-page">
      <div className="container-main">
        <PanelBackNavigation />
        <div className="library-heading">
          <span className="eyebrow">Biblioteka materiałów</span>
          <h1>Filmy, instrukcje i pliki do pracy własnej.</h1>
        </div>

        {items.length > 0 ? (
          <>
            <form className="library-filters" action="/biblioteka">
              <label>
                <span>Szukaj</span>
                <input
                  name="q"
                  type="search"
                  placeholder="np. oddech, barki, plecy"
                  defaultValue={normalizeFilter(searchParams.q)}
                />
              </label>
              <label>
                <span>Typ</span>
                <select name="typ" defaultValue={normalizedType}>
                  {Object.entries(itemTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Temat</span>
                <select name="temat" defaultValue={selectedTopic}>
                  <option value="">Wszystkie tematy</option>
                  {libraryTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>
              <div className="library-filters__actions">
                <button type="submit" className="button-primary">
                  Filtruj
                </button>
                <Link href="/biblioteka" className="button-secondary">
                  Wyczyść
                </Link>
              </div>
            </form>
            <p className="library-result-count">
              Pokazano {filteredItems.length} z {items.length} materiałów.
            </p>
          </>
        ) : null}

        {filteredItems.length > 0 ? (
          <div className="library-list">
            {filteredItems.map((item) => (
              <article key={item.id} className="library-card">
                <div className="library-card__copy">
                  <p>{item.itemType === "video" ? "Film" : item.itemType === "file" ? "Plik" : "Instrukcja"}</p>
                  <h2>{item.title}</h2>
                  {item.summary ? <span>{item.summary}</span> : null}
                  {item.contentMarkdown ? (
                    <small>
                      {item.contentMarkdown.length > 220
                        ? `${item.contentMarkdown.slice(0, 220)}...`
                        : item.contentMarkdown}
                    </small>
                  ) : null}
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
                    <Link
                      href={`/biblioteka/${item.slug}`}
                      className="button-primary"
                    >
                      Otwórz materiał
                    </Link>
                  ) : null}
                  {(item.videoStorageKey || item.attachmentStorageKey) ? (
                    <Link
                      href={`/biblioteka/${item.slug}`}
                      className="button-primary"
                    >
                      Szczegóły
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="library-empty">
            <h2>Brak materiałów dla wybranych filtrów.</h2>
            <p>Zmień wyszukiwanie albo wyczyść filtry.</p>
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
