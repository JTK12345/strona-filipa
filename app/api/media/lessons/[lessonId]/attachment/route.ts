import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { getAccessibleLessonAttachment, isUuid } from "@/app/lib/course-content";
import { getCurrentUserSession } from "@/app/lib/session";
import { resolveVideoStoragePath } from "@/app/lib/video-storage";
import { createContentDisposition } from "@/app/lib/content-disposition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveStoragePath(storageKey: string) {
  return resolveVideoStoragePath(
    process.env.VIDEO_STORAGE_PATH ?? "/data/videos",
    storageKey,
  );
}

async function serveLessonAttachment(
  context: { params: Promise<{ lessonId: string }> },
  includeBody: boolean,
) {
  const session = await getCurrentUserSession();

  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { lessonId } = await context.params;

  if (!isUuid(lessonId)) {
    return new Response(null, { status: 404 });
  }

  const attachment = await getAccessibleLessonAttachment(
    session.userId,
    session.role,
    lessonId,
  );
  const filePath = attachment
    ? resolveStoragePath(attachment.storage_key)
    : null;

  if (!attachment || !filePath) {
    return new Response(null, { status: 404 });
  }

  const fileStats = await stat(filePath).catch(() => null);

  if (!fileStats?.isFile()) {
    return new Response(null, { status: 404 });
  }

  const stream = includeBody ? Readable.toWeb(createReadStream(filePath)) : null;

  return new Response(stream as ReadableStream<Uint8Array> | null, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": createContentDisposition("attachment", attachment.file_name),
      "Content-Length": String(fileStats.size),
      "Content-Type": attachment.mime_type ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  return serveLessonAttachment(context, true);
}

export async function HEAD(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  return serveLessonAttachment(context, false);
}
