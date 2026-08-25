import "server-only";

import { isAbsolute, relative, resolve } from "node:path";
import { queryDatabase } from "@/app/lib/db";

export type LibraryItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  itemType: "video" | "note" | "file";
  contentMarkdown: string;
  storageKey: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  status: "draft" | "published" | "archived";
  position: number;
  publishedAt: Date | null;
  createdAt: Date;
};

type LibraryItemRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  item_type: "video" | "note" | "file";
  content_markdown: string;
  storage_key: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: string | number | null;
  status: "draft" | "published" | "archived";
  position: number;
  published_at: Date | null;
  created_at: Date;
};

const librarySelect = `
  SELECT
    id,
    slug,
    title,
    summary,
    item_type,
    content_markdown,
    storage_key,
    file_name,
    mime_type,
    file_size_bytes,
    status,
    position,
    published_at,
    created_at
  FROM library_items
`;

function mapLibraryItem(row: LibraryItemRow): LibraryItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    itemType: row.item_type,
    contentMarkdown: row.content_markdown,
    storageKey: row.storage_key,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSizeBytes:
      row.file_size_bytes === null ? null : Number(row.file_size_bytes),
    status: row.status,
    position: row.position,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export function slugifyLibraryTitle(title: string) {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || `material-${Date.now()}`;
}

export function resolveLibraryStoragePath(
  storageRootValue: string,
  storageKey: string,
) {
  const storageRoot = resolve(storageRootValue);
  const filePath = resolve(storageRoot, storageKey);
  const relativePath = relative(storageRoot, filePath);

  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    isAbsolute(relativePath)
  ) {
    return null;
  }

  return filePath;
}

export async function getPublishedLibraryItems() {
  const result = await queryDatabase<LibraryItemRow>(
    `${librarySelect}
     WHERE status = 'published'
     ORDER BY position, created_at DESC`,
  );

  return result.rows.map(mapLibraryItem);
}

export async function getAdminLibraryItems() {
  const result = await queryDatabase<LibraryItemRow>(
    `${librarySelect}
     WHERE status <> 'archived'
     ORDER BY position, created_at DESC
     LIMIT 200`,
  );

  return result.rows.map(mapLibraryItem);
}

export async function getLibraryItemMedia(itemId: string) {
  const result = await queryDatabase<{
    storage_key: string;
    file_name: string | null;
    mime_type: string | null;
  }>(
    `SELECT storage_key, file_name, mime_type
     FROM library_items
     WHERE id = $1
       AND status = 'published'
       AND storage_key IS NOT NULL
     LIMIT 1`,
    [itemId],
  );

  return result.rows[0] ?? null;
}
