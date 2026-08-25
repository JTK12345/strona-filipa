import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { queryDatabase } from "@/app/lib/db";
import {
  resolveLibraryStoragePath,
  slugifyLibraryTitle,
} from "@/app/lib/library";
import { isSameOriginFormRequest } from "@/app/lib/auth";
import { getCurrentUserSession } from "@/app/lib/session";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";

export const runtime = "nodejs";

const maxUploadBytes = 1024 * 1024 * 600;
const allowedVideoTypes = new Set(["video/mp4", "video/webm"]);
const allowedAttachmentTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

type StoredUpload = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
};

function redirectToAdmin(result: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/panel/admin/materialy?material=${result}` },
  });
}

function storageRoot() {
  return process.env.LIBRARY_STORAGE_PATH ?? process.env.VIDEO_STORAGE_PATH ?? "/data/videos";
}

function safeExtension(fileName: string) {
  const extension = extname(fileName).toLowerCase();

  if (/^\.[a-z0-9]{1,8}$/.test(extension)) {
    return extension;
  }

  return "";
}

async function saveUpload(
  upload: FormDataEntryValue | null,
  kind: "video" | "attachment",
) {
  if (!(upload instanceof File) || upload.size === 0) {
    return null;
  }

  const allowedTypes =
    kind === "video" ? allowedVideoTypes : allowedAttachmentTypes;

  if (upload.size > maxUploadBytes || !allowedTypes.has(upload.type)) {
    return null;
  }

  const folder = kind === "video" ? "library/videos" : "library/files";
  const key = `${folder}/${randomUUID()}${safeExtension(upload.name)}`;
  const targetPath = resolveLibraryStoragePath(storageRoot(), key);

  if (!targetPath) {
    return null;
  }

  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, Buffer.from(await upload.arrayBuffer()));

  return {
    storageKey: key,
    fileName: upload.name.slice(0, 180),
    mimeType: upload.type,
    fileSizeBytes: upload.size,
  } satisfies StoredUpload;
}

async function unlinkStorageKey(storageKey: string | null) {
  const filePath = storageKey
    ? resolveLibraryStoragePath(storageRoot(), storageKey)
    : null;

  if (filePath) {
    await unlink(filePath).catch(() => undefined);
  }
}

function itemTypeFor(input: {
  contentMarkdown: string;
  video: StoredUpload | null;
  attachment: StoredUpload | null;
}) {
  if (input.video) {
    return "video";
  }

  if (input.attachment) {
    return "file";
  }

  return "note";
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const session = await getCurrentUserSession();

  if (!session || session.role !== "admin") {
    return new NextResponse(null, { status: 403 });
  }

  const rateLimit = await checkRateLimit("admin-library-items", session.userId, {
    endpointLimit: 20,
    globalLimit: 40,
  });

  if (!rateLimit.allowed) {
    return redirectToAdmin("rate");
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectToAdmin("invalid");
  }

  const action = String(formData.get("action") ?? "");

  if (action === "archive") {
    const itemId = String(formData.get("itemId") ?? "");
    const existing = await queryDatabase<{
      video_storage_key: string | null;
      attachment_storage_key: string | null;
    }>(
      `SELECT video_storage_key, attachment_storage_key
       FROM library_items
       WHERE id = $1
       LIMIT 1`,
      [itemId],
    );

    await queryDatabase(
      `UPDATE library_items
       SET status = 'archived'
       WHERE id = $1`,
      [itemId],
    );

    await unlinkStorageKey(existing.rows[0]?.video_storage_key ?? null);
    await unlinkStorageKey(existing.rows[0]?.attachment_storage_key ?? null);

    return redirectToAdmin("archived");
  }

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const contentMarkdown = String(formData.get("contentMarkdown") ?? "").trim();
  const status = String(formData.get("status") ?? "") === "draft" ? "draft" : "published";
  const videoUpload = formData.get("video");
  const attachmentUpload = formData.get("attachment");

  if (title.length < 3 || title.length > 160) {
    return redirectToAdmin("invalid");
  }

  const video = await saveUpload(videoUpload, "video");
  const attachment = await saveUpload(attachmentUpload, "attachment");

  if (
    (videoUpload instanceof File && videoUpload.size > 0 && !video) ||
    (attachmentUpload instanceof File && attachmentUpload.size > 0 && !attachment)
  ) {
    return redirectToAdmin("file");
  }

  if (action === "update") {
    const itemId = String(formData.get("itemId") ?? "");
    const existing = await queryDatabase<{
      video_storage_key: string | null;
      attachment_storage_key: string | null;
    }>(
      `SELECT video_storage_key, attachment_storage_key
       FROM library_items
       WHERE id = $1
         AND status <> 'archived'
       LIMIT 1`,
      [itemId],
    );

    if (!existing.rows[0]) {
      return redirectToAdmin("invalid");
    }

    if (
      !video &&
      !attachment &&
      !existing.rows[0].video_storage_key &&
      !existing.rows[0].attachment_storage_key &&
      !contentMarkdown
    ) {
      return redirectToAdmin("invalid");
    }

    await queryDatabase(
      `UPDATE library_items
       SET
         title = $2,
         summary = $3,
         content_markdown = $4,
         status = $5,
         item_type = CASE
           WHEN COALESCE($6, video_storage_key) IS NOT NULL THEN 'video'
           WHEN COALESCE($10, attachment_storage_key) IS NOT NULL THEN 'file'
           ELSE 'note'
         END,
         video_storage_key = COALESCE($6, video_storage_key),
         video_file_name = COALESCE($7, video_file_name),
         video_mime_type = COALESCE($8, video_mime_type),
         video_file_size_bytes = COALESCE($9, video_file_size_bytes),
         attachment_storage_key = COALESCE($10, attachment_storage_key),
         attachment_file_name = COALESCE($11, attachment_file_name),
         attachment_mime_type = COALESCE($12, attachment_mime_type),
         attachment_file_size_bytes = COALESCE($13, attachment_file_size_bytes),
         published_at = CASE
           WHEN $5 = 'published' AND published_at IS NULL THEN now()
           WHEN $5 = 'draft' THEN NULL
           ELSE published_at
         END
       WHERE id = $1`,
      [
        itemId,
        title,
        summary.slice(0, 400),
        contentMarkdown.slice(0, 20_000),
        status,
        video?.storageKey,
        video?.fileName,
        video?.mimeType,
        video?.fileSizeBytes,
        attachment?.storageKey,
        attachment?.fileName,
        attachment?.mimeType,
        attachment?.fileSizeBytes,
      ],
    );

    if (video) {
      await unlinkStorageKey(existing.rows[0].video_storage_key);
    }

    if (attachment) {
      await unlinkStorageKey(existing.rows[0].attachment_storage_key);
    }

    return redirectToAdmin("updated");
  }

  if (!contentMarkdown && !video && !attachment) {
    return redirectToAdmin("invalid");
  }

  await queryDatabase(
    `INSERT INTO library_items (
       slug,
       title,
       summary,
       item_type,
       content_markdown,
       video_storage_key,
       video_file_name,
       video_mime_type,
       video_file_size_bytes,
       attachment_storage_key,
       attachment_file_name,
       attachment_mime_type,
       attachment_file_size_bytes,
       status,
       published_at
     )
     VALUES (
       $1, $2, $3, $4, $5,
       $6, $7, $8, $9,
       $10, $11, $12, $13,
       $14,
       CASE WHEN $14 = 'published' THEN now() ELSE NULL END
     )`,
    [
      `${slugifyLibraryTitle(title)}-${randomUUID().slice(0, 8)}`,
      title,
      summary.slice(0, 400),
      itemTypeFor({ contentMarkdown, video, attachment }),
      contentMarkdown.slice(0, 20_000),
      video?.storageKey ?? null,
      video?.fileName ?? null,
      video?.mimeType ?? null,
      video?.fileSizeBytes ?? null,
      attachment?.storageKey ?? null,
      attachment?.fileName ?? null,
      attachment?.mimeType ?? null,
      attachment?.fileSizeBytes ?? null,
      status,
    ],
  );

  return redirectToAdmin("created");
}
