import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getLibraryItemMedia, resolveLibraryStoragePath } from "@/app/lib/library";
import { getCurrentUserSession } from "@/app/lib/session";
import { parseSingleRange } from "@/app/lib/video-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function storageRoot() {
  return process.env.LIBRARY_STORAGE_PATH ?? process.env.VIDEO_STORAGE_PATH ?? "/data/videos";
}

async function serveLibraryMedia(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
  includeBody: boolean,
) {
  const session = await getCurrentUserSession();

  if (!session?.hasLibraryAccess) {
    return new NextResponse(null, { status: session ? 403 : 401 });
  }

  const { itemId } = await context.params;
  const media = await getLibraryItemMedia(itemId);
  const filePath = media ? resolveLibraryStoragePath(storageRoot(), media.storage_key) : null;

  if (!media || !filePath) {
    return new NextResponse(null, { status: 404 });
  }

  const fileStats = await stat(filePath).catch(() => null);

  if (!fileStats?.isFile()) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = media.mime_type ?? "application/octet-stream";
  const commonHeaders = {
    "Accept-Ranges": contentType.startsWith("video/") ? "bytes" : "none",
    "Cache-Control": "private, no-store",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  };

  if (contentType.startsWith("video/")) {
    const rangeHeader = request.headers.get("range");

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

      const stream = includeBody
        ? Readable.toWeb(createReadStream(filePath, range))
        : null;

      return new Response(stream as ReadableStream<Uint8Array> | null, {
        status: 206,
        headers: {
          ...commonHeaders,
          "Content-Length": String(range.end - range.start + 1),
          "Content-Range": `bytes ${range.start}-${range.end}/${fileStats.size}`,
        },
      });
    }
  }

  const stream = includeBody ? Readable.toWeb(createReadStream(filePath)) : null;

  return new Response(stream as ReadableStream<Uint8Array> | null, {
    status: 200,
    headers: {
      ...commonHeaders,
      "Content-Length": String(fileStats.size),
      "Content-Disposition": media.file_name
        ? `inline; filename="${encodeURIComponent(media.file_name)}"`
        : "inline",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  return serveLibraryMedia(request, context, true);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  return serveLibraryMedia(request, context, false);
}
