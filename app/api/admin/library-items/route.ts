import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
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

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/webm",
]);

function redirectToAdmin(result: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/panel/admin/materialy?material=${result}` },
  });
}

function storageRoot() {
  return process.env.LIBRARY_STORAGE_PATH ?? process.env.VIDEO_STORAGE_PATH ?? "/data/videos";
}

function inferItemType(mimeType: string, requestedType: string) {
  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (requestedType === "note") {
    return "note";
  }

  return "file";
}

function safeExtension(fileName: string) {
  const extension = extname(fileName).toLowerCase();

  if (/^\.[a-z0-9]{1,8}$/.test(extension)) {
    return extension;
  }

  return "";
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
    const existing = await queryDatabase<{ storage_key: string | null }>(
      `SELECT storage_key
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

    const storageKey = existing.rows[0]?.storage_key;
    const filePath = storageKey ? resolveLibraryStoragePath(storageRoot(), storageKey) : null;

    if (filePath) {
      await unlink(filePath).catch(() => undefined);
    }

    return redirectToAdmin("archived");
  }

  if (action === "update") {
    const itemId = String(formData.get("itemId") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const contentMarkdown = String(formData.get("contentMarkdown") ?? "").trim();
    const status = String(formData.get("status") ?? "") === "draft" ? "draft" : "published";
    const upload = formData.get("file");

    if (title.length < 3 || title.length > 160) {
      return redirectToAdmin("invalid");
    }

    const existing = await queryDatabase<{
      storage_key: string | null;
      item_type: "video" | "note" | "file";
    }>(
      `SELECT storage_key, item_type
       FROM library_items
       WHERE id = $1
         AND status <> 'archived'
       LIMIT 1`,
      [itemId],
    );

    if (!existing.rows[0]) {
      return redirectToAdmin("invalid");
    }

    let storageKey: string | null | undefined;
    let fileName: string | null | undefined;
    let mimeType: string | null | undefined;
    let fileSizeBytes: number | null | undefined;
    let itemType: "video" | "note" | "file" = existing.rows[0].item_type;

    if (upload instanceof File && upload.size > 0) {
      if (upload.size > maxUploadBytes || !allowedMimeTypes.has(upload.type)) {
        return redirectToAdmin("file");
      }

      const folder = "library";
      const key = `${folder}/${randomUUID()}${safeExtension(upload.name)}`;
      const targetPath = resolveLibraryStoragePath(storageRoot(), key);

      if (!targetPath) {
        return redirectToAdmin("invalid");
      }

      await mkdir(join(storageRoot(), folder), { recursive: true });
      await writeFile(targetPath, Buffer.from(await upload.arrayBuffer()));

      storageKey = key;
      fileName = upload.name.slice(0, 180);
      mimeType = upload.type;
      fileSizeBytes = upload.size;
      itemType = inferItemType(upload.type, "");

      const oldFilePath = existing.rows[0].storage_key
        ? resolveLibraryStoragePath(storageRoot(), existing.rows[0].storage_key)
        : null;

      if (oldFilePath) {
        await unlink(oldFilePath).catch(() => undefined);
      }
    } else if (!existing.rows[0].storage_key && !contentMarkdown) {
      return redirectToAdmin("invalid");
    } else if (!existing.rows[0].storage_key) {
      itemType = "note";
    }

    await queryDatabase(
      `UPDATE library_items
       SET
         title = $2,
         summary = $3,
         content_markdown = $4,
         status = $5,
         item_type = $6,
         storage_key = COALESCE($7, storage_key),
         file_name = COALESCE($8, file_name),
         mime_type = COALESCE($9, mime_type),
         file_size_bytes = COALESCE($10, file_size_bytes),
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
        itemType,
        storageKey,
        fileName,
        mimeType,
        fileSizeBytes,
      ],
    );

    return redirectToAdmin("updated");
  }

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const contentMarkdown = String(formData.get("contentMarkdown") ?? "").trim();
  const status = String(formData.get("status") ?? "") === "draft" ? "draft" : "published";
  const requestedType = String(formData.get("itemType") ?? "");
  const upload = formData.get("file");

  if (title.length < 3 || title.length > 160) {
    return redirectToAdmin("invalid");
  }

  let storageKey: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let fileSizeBytes: number | null = null;
  let itemType: "video" | "note" | "file" = requestedType === "note" ? "note" : "file";

  if (upload instanceof File && upload.size > 0) {
    if (upload.size > maxUploadBytes || !allowedMimeTypes.has(upload.type)) {
      return redirectToAdmin("file");
    }

    const folder = "library";
    const key = `${folder}/${randomUUID()}${safeExtension(upload.name)}`;
    const targetPath = resolveLibraryStoragePath(storageRoot(), key);

    if (!targetPath) {
      return redirectToAdmin("invalid");
    }

    await mkdir(join(storageRoot(), folder), { recursive: true });
    await writeFile(targetPath, Buffer.from(await upload.arrayBuffer()));

    storageKey = key;
    fileName = upload.name.slice(0, 180);
    mimeType = upload.type;
    fileSizeBytes = upload.size;
    itemType = inferItemType(upload.type, requestedType);
  } else if (!contentMarkdown) {
    return redirectToAdmin("invalid");
  } else {
    itemType = "note";
  }

  await queryDatabase(
    `INSERT INTO library_items (
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
       published_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CASE WHEN $10 = 'published' THEN now() ELSE NULL END)`,
    [
      `${slugifyLibraryTitle(title)}-${randomUUID().slice(0, 8)}`,
      title,
      summary.slice(0, 400),
      itemType,
      contentMarkdown.slice(0, 20_000),
      storageKey,
      fileName,
      mimeType,
      fileSizeBytes,
      status,
    ],
  );

  return redirectToAdmin("created");
}
