import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { getAccessibleLessonMedia, isUuid } from "@/app/lib/course-content";
import { getCurrentUserSession } from "@/app/lib/session";
import {
  getVideoContentType,
  parseSingleRange,
  resolveVideoStoragePath,
} from "@/app/lib/video-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveStoragePath(storageKey: string) {
  return resolveVideoStoragePath(
    process.env.VIDEO_STORAGE_PATH ?? "/data/videos",
    storageKey,
  );
}

async function serveLessonMedia(
  request: Request,
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

  const media = await getAccessibleLessonMedia(
    session.userId,
    session.role,
    lessonId,
  );
  const filePath = media ? resolveStoragePath(media.storage_key) : null;
  const contentType = filePath ? getVideoContentType(filePath) : null;

  if (!filePath || !contentType) {
    return new Response(null, { status: 404 });
  }

  const fileStats = await stat(filePath).catch(() => null);

  if (!fileStats?.isFile()) {
    return new Response(null, { status: 404 });
  }

  const rangeHeader = request.headers.get("range");
  const commonHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  };

  if (rangeHeader) {
    const range = parseSingleRange(rangeHeader, fileStats.size);

    if (!range) {
      return new Response(null, {
        status: 416,
        headers: {
          ...commonHeaders,
          "Content-Range": `bytes */${fileStats.size}`,
        },
      });
    }

    const contentLength = range.end - range.start + 1;
    const stream = includeBody
      ? Readable.toWeb(createReadStream(filePath, range))
      : null;

    return new Response(stream as ReadableStream<Uint8Array> | null, {
      status: 206,
      headers: {
        ...commonHeaders,
        "Content-Length": String(contentLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${fileStats.size}`,
      },
    });
  }

  const stream = includeBody ? Readable.toWeb(createReadStream(filePath)) : null;

  return new Response(stream as ReadableStream<Uint8Array> | null, {
    status: 200,
    headers: {
      ...commonHeaders,
      "Content-Length": String(fileStats.size),
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  return serveLessonMedia(request, context, true);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  return serveLessonMedia(request, context, false);
}
