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
  videoStorageKey: string | null;
  videoFileName: string | null;
  videoMimeType: string | null;
  videoFileSizeBytes: number | null;
  attachmentStorageKey: string | null;
  attachmentFileName: string | null;
  attachmentMimeType: string | null;
  attachmentFileSizeBytes: number | null;
  status: "draft" | "published" | "archived";
  visibility: "all_access" | "selected_users";
  grantedUserIds: string[];
  grantedUserEmails: string[];
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
  video_storage_key: string | null;
  video_file_name: string | null;
  video_mime_type: string | null;
  video_file_size_bytes: string | number | null;
  attachment_storage_key: string | null;
  attachment_file_name: string | null;
  attachment_mime_type: string | null;
  attachment_file_size_bytes: string | number | null;
  status: "draft" | "published" | "archived";
  visibility: "all_access" | "selected_users";
  granted_user_ids: string[];
  granted_user_emails: string[];
  position: number;
  published_at: Date | null;
  created_at: Date;
};

const librarySelect = `
  SELECT
    library_items.id,
    library_items.slug,
    library_items.title,
    library_items.summary,
    library_items.item_type,
    library_items.content_markdown,
    library_items.storage_key,
    library_items.file_name,
    library_items.mime_type,
    library_items.file_size_bytes,
    library_items.video_storage_key,
    library_items.video_file_name,
    library_items.video_mime_type,
    library_items.video_file_size_bytes,
    library_items.attachment_storage_key,
    library_items.attachment_file_name,
    library_items.attachment_mime_type,
    library_items.attachment_file_size_bytes,
    library_items.status,
    library_items.visibility,
    COALESCE(
      array_agg(library_item_user_grants.user_id::text ORDER BY users.email)
        FILTER (WHERE library_item_user_grants.user_id IS NOT NULL),
      ARRAY[]::text[]
    ) AS granted_user_ids,
    COALESCE(
      array_agg(users.email ORDER BY users.email)
        FILTER (WHERE users.email IS NOT NULL),
      ARRAY[]::text[]
    ) AS granted_user_emails,
    library_items.position,
    library_items.published_at,
    library_items.created_at
  FROM library_items
  LEFT JOIN library_item_user_grants
    ON library_item_user_grants.library_item_id = library_items.id
  LEFT JOIN users
    ON users.id = library_item_user_grants.user_id
`;

const libraryGroupBy = `
  GROUP BY
    library_items.id,
    library_items.slug,
    library_items.title,
    library_items.summary,
    library_items.item_type,
    library_items.content_markdown,
    library_items.storage_key,
    library_items.file_name,
    library_items.mime_type,
    library_items.file_size_bytes,
    library_items.video_storage_key,
    library_items.video_file_name,
    library_items.video_mime_type,
    library_items.video_file_size_bytes,
    library_items.attachment_storage_key,
    library_items.attachment_file_name,
    library_items.attachment_mime_type,
    library_items.attachment_file_size_bytes,
    library_items.status,
    library_items.visibility,
    library_items.position,
    library_items.published_at,
    library_items.created_at
`;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

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
    videoStorageKey: row.video_storage_key,
    videoFileName: row.video_file_name,
    videoMimeType: row.video_mime_type,
    videoFileSizeBytes:
      row.video_file_size_bytes === null
        ? null
        : Number(row.video_file_size_bytes),
    attachmentStorageKey: row.attachment_storage_key,
    attachmentFileName: row.attachment_file_name,
    attachmentMimeType: row.attachment_mime_type,
    attachmentFileSizeBytes:
      row.attachment_file_size_bytes === null
        ? null
        : Number(row.attachment_file_size_bytes),
    status: row.status,
    visibility: row.visibility,
    grantedUserIds: row.granted_user_ids,
    grantedUserEmails: row.granted_user_emails,
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
     WHERE library_items.status = 'published'
     ${libraryGroupBy}
     ORDER BY library_items.position, library_items.created_at DESC`,
  );

  return result.rows.map(mapLibraryItem);
}

export async function getAccessibleLibraryItems(
  userId: string,
  isAdmin: boolean,
  hasLibraryAccess: boolean,
) {
  const result = await queryDatabase<LibraryItemRow>(
    `${librarySelect}
     WHERE library_items.status = 'published'
       AND (
         $2::boolean
         OR ($3::boolean AND library_items.visibility = 'all_access')
         OR EXISTS (
           SELECT 1
           FROM library_item_user_grants grants
           WHERE grants.library_item_id = library_items.id
             AND grants.user_id = $1
         )
       )
     ${libraryGroupBy}
     ORDER BY library_items.position, library_items.created_at DESC`,
    [userId, isAdmin, hasLibraryAccess],
  );

  return result.rows.map(mapLibraryItem);
}

export async function getPublishedLibraryItemBySlug(slug: string) {
  const result = await queryDatabase<LibraryItemRow>(
    `${librarySelect}
     WHERE library_items.slug = $1
       AND library_items.status = 'published'
     ${libraryGroupBy}
     LIMIT 1`,
    [slug],
  );

  const item = result.rows[0];

  return item ? mapLibraryItem(item) : null;
}

export async function getAccessibleLibraryItemBySlug(
  slug: string,
  userId: string,
  isAdmin: boolean,
  hasLibraryAccess: boolean,
) {
  const result = await queryDatabase<LibraryItemRow>(
    `${librarySelect}
     WHERE library_items.slug = $1
       AND library_items.status = 'published'
       AND (
         $3::boolean
         OR ($4::boolean AND library_items.visibility = 'all_access')
         OR EXISTS (
           SELECT 1
           FROM library_item_user_grants grants
           WHERE grants.library_item_id = library_items.id
             AND grants.user_id = $2
         )
       )
     ${libraryGroupBy}
     LIMIT 1`,
    [slug, userId, isAdmin, hasLibraryAccess],
  );

  const item = result.rows[0];

  return item ? mapLibraryItem(item) : null;
}

export async function getAdminLibraryItems() {
  const result = await queryDatabase<LibraryItemRow>(
    `${librarySelect}
     WHERE library_items.status <> 'archived'
     ${libraryGroupBy}
     ORDER BY library_items.position, library_items.created_at DESC
     LIMIT 200`,
  );

  return result.rows.map(mapLibraryItem);
}

export async function getLibraryItemMedia(
  itemId: string,
  kind: "video" | "attachment",
  userId: string,
  isAdmin: boolean,
  hasLibraryAccess: boolean,
) {
  if (!isUuid(itemId) || !isUuid(userId)) {
    return null;
  }

  const result = await queryDatabase<{
    storage_key: string;
    file_name: string | null;
    mime_type: string | null;
  }>(
    `SELECT
       CASE WHEN $2 = 'video' THEN video_storage_key ELSE attachment_storage_key END AS storage_key,
       CASE WHEN $2 = 'video' THEN video_file_name ELSE attachment_file_name END AS file_name,
       CASE WHEN $2 = 'video' THEN video_mime_type ELSE attachment_mime_type END AS mime_type
     FROM library_items
     WHERE id = $1
       AND status = 'published'
       AND (
         $3::boolean
         OR ($5::boolean AND visibility = 'all_access')
         OR EXISTS (
           SELECT 1
           FROM library_item_user_grants grants
           WHERE grants.library_item_id = library_items.id
             AND grants.user_id = $4
         )
       )
       AND (
         ($2 = 'video' AND video_storage_key IS NOT NULL)
         OR ($2 = 'attachment' AND attachment_storage_key IS NOT NULL)
       )
     LIMIT 1`,
    [itemId, kind, isAdmin, userId, hasLibraryAccess],
  );

  return result.rows[0] ?? null;
}
