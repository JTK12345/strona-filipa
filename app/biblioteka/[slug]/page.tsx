import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getPublishedLibraryItemBySlug } from "@/app/lib/library";

export const metadata: Metadata = {
  title: "Materiał biblioteki | Świadomy Profil Ciała",
  robots: { index: false, follow: false },
};

function MaterialContent({ markdown }: { markdown: string }) {
  return markdown.split(/\n{2,}/).map((block) => {
    if (block.startsWith("## ")) {
      return <h2 key={block}>{block.slice(3)}</h2>;
    }

    if (block.startsWith("- ")) {
      return (
        <ul key={block}>
          {block.split("\n").map((item) => (
            <li key={item}>{item.replace(/^- /, "")}</li>
          ))}
        </ul>
      );
    }

    return <p key={block}>{block}</p>;
  });
}

export default async function LibraryItemPage(
  props: PageProps<"/biblioteka/[slug]">,
) {
  const session = await getCurrentAccessSession();

  if (!session) {
    redirect("/logowanie?next=/biblioteka");
  }

  if (!session.hasLibraryAccess) {
    redirect("/dostep?required=1");
  }

  const { slug } = await props.params;
  const item = await getPublishedLibraryItemBySlug(slug);

  if (!item) {
    notFound();
  }

  return (
    <section className="library-detail-page">
      <div className="container-main">
        <Link href="/biblioteka" className="back-home-button">
          <span aria-hidden="true">←</span>
          <span>Wróć do biblioteki</span>
        </Link>

        <article className="library-detail">
          <header className="library-detail__header">
            <p className="meta-label">
              {item.itemType === "video"
                ? "Film"
                : item.itemType === "file"
                  ? "Plik"
                  : "Instrukcja"}
            </p>
            <h1>{item.title}</h1>
            {item.summary ? <p>{item.summary}</p> : null}
          </header>

          {item.videoStorageKey ? (
            <video
              className="library-detail__video"
              controls
              preload="metadata"
              src={`/api/library-items/${item.id}/media?kind=video`}
            />
          ) : null}

          {item.contentMarkdown ? (
            <div className="library-detail__content">
              <MaterialContent markdown={item.contentMarkdown} />
            </div>
          ) : null}

          <div className="library-detail__actions">
            {item.videoStorageKey ? (
              <a
                href={`/api/library-items/${item.id}/media?kind=video`}
                className="button-secondary"
              >
                Otwórz film w nowej karcie
              </a>
            ) : null}
            {item.attachmentStorageKey ? (
              <a
                href={`/api/library-items/${item.id}/media?kind=attachment`}
                className="button-primary"
              >
                Pobierz plik{item.attachmentFileName ? `: ${item.attachmentFileName}` : ""}
              </a>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
