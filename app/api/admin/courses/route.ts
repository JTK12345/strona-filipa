import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
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
  getAdminCourseEditor,
  updateAdminCourse,
  updateAdminLesson,
  updateAdminModule,
} from "@/app/lib/admin-course-editor";
import { queryDatabase } from "@/app/lib/db";
import { isSameOriginFormRequest } from "@/app/lib/auth";
import { getCurrentUserSession } from "@/app/lib/session";
import { checkRateLimit } from "@/app/api/_utils/rateLimiter";
import { resolveVideoStoragePath } from "@/app/lib/video-storage";
import { isCourseEditorSuccess } from "@/app/lib/course-editor-feedback";
import { validateUpload } from "@/app/lib/upload-validation";
import { isUuid } from "@/app/lib/course-content";

export const runtime = "nodejs";

const maxVideoBytes = 1024 * 1024 * 1200;
const maxAttachmentBytes = 1024 * 1024 * 200;

async function respondToAdmin(request: Request, result: string, editCourseId = "", entityId?: string) {
  if (request.headers.get("accept")?.includes("application/json")) {
    const success = isCourseEditorSuccess(result);
    // Keep successful writes distinct from a failed read-back, so the UI never
    // invites the administrator to create the same item a second time.
    let courses;
    if (success) {
      try {
        courses = await getAdminCourseEditor();
      } catch {
        console.error("Course saved, but the editor could not reload its data.");
      }
    }
    return NextResponse.json(
      { result, courseId: editCourseId, entityId, courses, refreshRequired: success && !courses },
      {
        status: success ? 200 : result === "rate" ? 429 : result === "server" ? 500 : result.endsWith("_not_found") ? 404 : 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

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

async function saveVideo(upload: FormDataEntryValue | null) {
  if (!(upload instanceof File) || upload.size === 0) {
    return null;
  }

  const validated = await validateUpload(upload, "video", maxVideoBytes);

  if (!validated) {
    throw new AdminCourseEditorError("invalid");
  }

  const folder = "lessons";
  const key = `${folder}/${randomUUID()}${validated.extension}`;
  const targetPath = resolveVideoStoragePath(videoStorageRoot(), key);

  if (!targetPath) {
    throw new AdminCourseEditorError("invalid");
  }

  await mkdir(join(videoStorageRoot(), folder), { recursive: true });
  await writeFile(targetPath, validated.buffer);

  return key;
}

async function saveAttachment(upload: FormDataEntryValue | null) {
  if (!(upload instanceof File) || upload.size === 0) {
    return null;
  }

  const validated = await validateUpload(upload, "attachment", maxAttachmentBytes);

  if (!validated) {
    throw new AdminCourseEditorError("invalid");
  }

  const folder = "lesson-files";
  const key = `${folder}/${randomUUID()}${validated.extension}`;
  const targetPath = resolveVideoStoragePath(videoStorageRoot(), key);

  if (!targetPath) {
    throw new AdminCourseEditorError("invalid");
  }

  await mkdir(join(videoStorageRoot(), folder), { recursive: true });
  await writeFile(targetPath, validated.buffer);

  return {
    storageKey: key,
    fileName: validated.safeFileName,
    mimeType: validated.mimeType,
    fileSizeBytes: validated.buffer.length,
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
    return respondToAdmin(request, "rate");
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return respondToAdmin(request, "invalid");
  }

  const actionValues = formData.getAll("action");
  const action = String(actionValues.at(-1) ?? "");
  const editCourseId = String(formData.get("editCourse") ?? "");
  const redirectToCourseEditor = (result: string, entityId?: string) =>
    respondToAdmin(request, result, editCourseId, entityId);

  try {
    if (action === "create-course") {
      const courseId = await createAdminCourse({
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        levelLabel: String(formData.get("levelLabel") ?? "").trim(),
        durationLabel: String(formData.get("durationLabel") ?? "").trim(),
        status: normalizeStatus(formData.get("status")),
      });
      return respondToAdmin(request, "course_created", "", courseId);
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
      return respondToAdmin(request, "course_archived");
    }

    if (action === "create-module") {
      const moduleId = await createAdminModule({
        courseId: String(formData.get("courseId") ?? ""),
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
      });
      return redirectToCourseEditor("module_created", moduleId);
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
      if (!isUuid(moduleId)) {
        return redirectToCourseEditor("invalid");
      }
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

      const lessonId = await createAdminLesson({
        moduleId: String(formData.get("moduleId") ?? ""),
        title: String(formData.get("title") ?? "").trim(),
        summary: String(formData.get("summary") ?? "").trim(),
        contentMarkdown: String(formData.get("contentMarkdown") ?? "").trim(),
        status: normalizeStatus(formData.get("status")),
        videoStorageKey,
        attachment,
      });
      return redirectToCourseEditor("lesson_created", lessonId);
    }

    if (action === "update-lesson") {
      const lessonId = String(formData.get("lessonId") ?? "");
      if (!isUuid(lessonId)) {
        return redirectToCourseEditor("invalid");
      }
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
      if (!isUuid(lessonId)) {
        return redirectToCourseEditor("invalid");
      }
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
