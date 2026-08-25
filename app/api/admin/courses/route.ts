import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  AdminCourseEditorError,
  archiveAdminCourse,
  createAdminCourse,
  createAdminLesson,
  createAdminModule,
  deleteAdminLesson,
  deleteAdminModule,
  getAdminLessonVideoKey,
  getAdminLessonAttachmentKey,
  updateAdminCourse,
  updateAdminLesson,
  updateAdminModule,
} from "@/app/lib/admin-course-editor";
import { queryDatabase } from "@/app/lib/db";
import { isSameOriginFormRequest } from "@/app/lib/auth";
import { getCurrentUserSession } from "@/app/lib/session";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";
import { resolveVideoStoragePath } from "@/app/lib/video-storage";

export const runtime = "nodejs";

const maxVideoBytes = 1024 * 1024 * 1200;
const maxAttachmentBytes = 1024 * 1024 * 200;
const allowedVideoTypes = new Set(["video/mp4", "video/webm"]);
const allowedAttachmentTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

function redirectToAdmin(result: string, editCourseId = "") {
  const searchParams = new URLSearchParams({ course: result });

  if (editCourseId) {
    searchParams.set("editCourse", editCourseId);
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/panel/admin/kursy?${searchParams.toString()}` },
  });
}

function normalizeStatus(value: FormDataEntryValue | null) {
  return String(value ?? "") === "draft" ? "draft" : "published";
}

function videoStorageRoot() {
  return process.env.VIDEO_STORAGE_PATH ?? "/data/videos";
}

function safeExtension(fileName: string) {
  const extension = extname(fileName).toLowerCase();

  if (/^\.[a-z0-9]{1,8}$/.test(extension)) {
    return extension;
  }

  return "";
}

async function saveVideo(upload: FormDataEntryValue | null) {
  if (!(upload instanceof File) || upload.size === 0) {
    return null;
  }

  if (upload.size > maxVideoBytes || !allowedVideoTypes.has(upload.type)) {
    throw new AdminCourseEditorError("invalid");
  }

  const folder = "lessons";
  const key = `${folder}/${randomUUID()}${safeExtension(upload.name)}`;
  const targetPath = resolveVideoStoragePath(videoStorageRoot(), key);

  if (!targetPath) {
    throw new AdminCourseEditorError("invalid");
  }

  await mkdir(join(videoStorageRoot(), folder), { recursive: true });
  await writeFile(targetPath, Buffer.from(await upload.arrayBuffer()));

  return key;
}

async function saveAttachment(upload: FormDataEntryValue | null) {
  if (!(upload instanceof File) || upload.size === 0) {
    return null;
  }

  if (
    upload.size > maxAttachmentBytes ||
    !allowedAttachmentTypes.has(upload.type)
  ) {
    throw new AdminCourseEditorError("invalid");
  }

  const folder = "lesson-files";
  const key = `${folder}/${randomUUID()}${safeExtension(upload.name)}`;
  const targetPath = resolveVideoStoragePath(videoStorageRoot(), key);

  if (!targetPath) {
    throw new AdminCourseEditorError("invalid");
  }

  await mkdir(join(videoStorageRoot(), folder), { recursive: true });
  await writeFile(targetPath, Buffer.from(await upload.arrayBuffer()));

  return {
    storageKey: key,
    fileName: upload.name.slice(0, 180),
    mimeType: upload.type,
    fileSizeBytes: upload.size,
  };
}

async function unlinkVideoKey(storageKey: string | null) {
  const filePath = storageKey
    ? resolveVideoStoragePath(videoStorageRoot(), storageKey)
    : null;

  if (filePath) {
    await unlink(filePath).catch(() => undefined);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const session = await getCurrentUserSession();

  if (!session || session.role !== "admin") {
    return new NextResponse(null, { status: 403 });
  }

  const rateLimit = await checkRateLimit("admin-courses", session.userId, {
    endpointLimit: 30,
    globalLimit: 60,
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

  const actionValues = formData.getAll("action");
  const action = String(actionValues.at(-1) ?? "");
  const editCourseId = String(formData.get("editCourse") ?? "");
  const redirectToCourseEditor = (result: string) =>
    redirectToAdmin(result, editCourseId);

  try {
    if (action === "create-course") {
      await createAdminCourse({
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        levelLabel: String(formData.get("levelLabel") ?? "").trim(),
        durationLabel: String(formData.get("durationLabel") ?? "").trim(),
        status: normalizeStatus(formData.get("status")),
      });
      return redirectToAdmin("course_created");
    }

    if (action === "update-course") {
      await updateAdminCourse({
        courseId: String(formData.get("courseId") ?? ""),
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        levelLabel: String(formData.get("levelLabel") ?? "").trim(),
        durationLabel: String(formData.get("durationLabel") ?? "").trim(),
        status: normalizeStatus(formData.get("status")),
      });
      return redirectToCourseEditor("course_updated");
    }

    if (action === "archive-course") {
      await archiveAdminCourse(String(formData.get("courseId") ?? ""));
      return redirectToAdmin("course_archived");
    }

    if (action === "create-module") {
      await createAdminModule({
        courseId: String(formData.get("courseId") ?? ""),
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
      });
      return redirectToCourseEditor("module_created");
    }

    if (action === "update-module") {
      await updateAdminModule({
        moduleId: String(formData.get("moduleId") ?? ""),
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
      });
      return redirectToCourseEditor("module_updated");
    }

    if (action === "delete-module") {
      const moduleId = String(formData.get("moduleId") ?? "");
      const videoKeys = await queryDatabase<{ video_storage_key: string | null }>(
        `SELECT video_storage_key
         FROM lessons
         WHERE module_id = $1
           AND video_storage_key IS NOT NULL`,
        [moduleId],
      );
      const attachmentKeys = await queryDatabase<{
        attachment_storage_key: string | null;
      }>(
        `SELECT attachment_storage_key
         FROM lessons
         WHERE module_id = $1
           AND attachment_storage_key IS NOT NULL`,
        [moduleId],
      );

      await deleteAdminModule(moduleId);
      await Promise.all(videoKeys.rows.map((row) => unlinkVideoKey(row.video_storage_key)));
      await Promise.all(
        attachmentKeys.rows.map((row) =>
          unlinkVideoKey(row.attachment_storage_key),
        ),
      );

      return redirectToCourseEditor("module_deleted");
    }

    if (action === "create-lesson") {
      const videoStorageKey = await saveVideo(formData.get("video"));
      const attachment = await saveAttachment(formData.get("attachment"));

      await createAdminLesson({
        moduleId: String(formData.get("moduleId") ?? ""),
        title: String(formData.get("title") ?? "").trim(),
        summary: String(formData.get("summary") ?? "").trim(),
        contentMarkdown: String(formData.get("contentMarkdown") ?? "").trim(),
        status: normalizeStatus(formData.get("status")),
        videoStorageKey,
        attachment,
      });
      return redirectToCourseEditor("lesson_created");
    }

    if (action === "update-lesson") {
      const lessonId = String(formData.get("lessonId") ?? "");
      const oldVideoKey = await getAdminLessonVideoKey(lessonId);
      const oldAttachmentKey = await getAdminLessonAttachmentKey(lessonId);
      const videoStorageKey = await saveVideo(formData.get("video"));
      const attachment = await saveAttachment(formData.get("attachment"));

      await updateAdminLesson({
        lessonId,
        title: String(formData.get("title") ?? "").trim(),
        summary: String(formData.get("summary") ?? "").trim(),
        contentMarkdown: String(formData.get("contentMarkdown") ?? "").trim(),
        status: normalizeStatus(formData.get("status")),
        videoStorageKey: videoStorageKey ?? undefined,
        attachment: attachment ?? undefined,
      });

      if (videoStorageKey) {
        await unlinkVideoKey(oldVideoKey);
      }

      if (attachment) {
        await unlinkVideoKey(oldAttachmentKey);
      }

      return redirectToCourseEditor("lesson_updated");
    }

    if (action === "delete-lesson") {
      const lessonId = String(formData.get("lessonId") ?? "");
      const videoKey = await getAdminLessonVideoKey(lessonId);
      const attachmentKey = await getAdminLessonAttachmentKey(lessonId);

      await deleteAdminLesson(lessonId);
      await unlinkVideoKey(videoKey);
      await unlinkVideoKey(attachmentKey);

      return redirectToCourseEditor("lesson_deleted");
    }
  } catch (error) {
    if (error instanceof AdminCourseEditorError) {
      return redirectToCourseEditor(error.code);
    }

    console.error("Admin course update failed with an unexpected error.");
    return redirectToCourseEditor("server");
  }

  return redirectToCourseEditor("invalid");
}
