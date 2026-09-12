import "server-only";

import { queryDatabase, withDatabaseTransaction } from "@/app/lib/db";
import { isUuid } from "@/app/lib/course-content";
import { slugifyLibraryTitle } from "@/app/lib/library";

type AdminCourseRow = {
  course_id: string;
  course_slug: string;
  course_title: string;
  course_description: string;
  course_status: "draft" | "published" | "archived";
  course_level_label: string;
  course_duration_label: string;
  course_position: number;
  module_id: string | null;
  module_title: string | null;
  module_description: string | null;
  module_position: number | null;
  lesson_id: string | null;
  lesson_title: string | null;
  lesson_summary: string | null;
  lesson_content_markdown: string | null;
  lesson_status: "draft" | "published" | null;
  lesson_position: number | null;
  lesson_video_storage_key: string | null;
  lesson_attachment_storage_key: string | null;
  lesson_attachment_file_name: string | null;
};

export type AdminCourseEditorLesson = {
  id: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  status: "draft" | "published";
  position: number;
  hasVideo: boolean;
  hasAttachment: boolean;
  attachmentFileName: string | null;
};

export type AdminCourseEditorModule = {
  id: string;
  title: string;
  description: string;
  position: number;
  lessons: AdminCourseEditorLesson[];
};

export type AdminCourseEditorCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  levelLabel: string;
  durationLabel: string;
  position: number;
  modules: AdminCourseEditorModule[];
};

export class AdminCourseEditorError extends Error {
  constructor(
    public readonly code:
      | "invalid"
      | "course_not_found"
      | "module_not_found"
      | "lesson_not_found",
  ) {
    super(code);
    this.name = "AdminCourseEditorError";
  }
}

function normalizeStatus(value: string) {
  return value === "draft" ? "draft" : "published";
}

function validateTitle(title: string) {
  return title.length >= 3 && title.length <= 160;
}

export async function getAdminCourseEditor() {
  const result = await queryDatabase<AdminCourseRow>(
    `SELECT
       courses.id AS course_id,
       courses.slug AS course_slug,
       courses.title AS course_title,
       courses.description AS course_description,
       courses.status AS course_status,
       courses.level_label AS course_level_label,
       courses.duration_label AS course_duration_label,
       courses.position AS course_position,
       course_modules.id AS module_id,
       course_modules.title AS module_title,
       course_modules.description AS module_description,
       course_modules.position AS module_position,
       lessons.id AS lesson_id,
       lessons.title AS lesson_title,
       lessons.summary AS lesson_summary,
       lessons.content_markdown AS lesson_content_markdown,
       lessons.status AS lesson_status,
       lessons.position AS lesson_position,
       lessons.video_storage_key AS lesson_video_storage_key,
       lessons.attachment_storage_key AS lesson_attachment_storage_key,
       lessons.attachment_file_name AS lesson_attachment_file_name
     FROM courses
     LEFT JOIN course_modules ON course_modules.course_id = courses.id
     LEFT JOIN lessons ON lessons.module_id = course_modules.id
     WHERE courses.status <> 'archived'
     ORDER BY courses.position, courses.created_at, course_modules.position, lessons.position`,
  );
  const courses = new Map<string, AdminCourseEditorCourse>();

  for (const row of result.rows) {
    let course = courses.get(row.course_id);

    if (!course) {
      course = {
        id: row.course_id,
        slug: row.course_slug,
        title: row.course_title,
        description: row.course_description,
        status: row.course_status,
        levelLabel: row.course_level_label,
        durationLabel: row.course_duration_label,
        position: row.course_position,
        modules: [],
      };
      courses.set(row.course_id, course);
    }

    if (!row.module_id || !row.module_title || row.module_position === null) {
      continue;
    }

    let courseModule = course.modules.find((item) => item.id === row.module_id);

    if (!courseModule) {
      courseModule = {
        id: row.module_id,
        title: row.module_title,
        description: row.module_description ?? "",
        position: row.module_position,
        lessons: [],
      };
      course.modules.push(courseModule);
    }

    if (
      row.lesson_id &&
      row.lesson_title &&
      row.lesson_status &&
      row.lesson_position !== null
    ) {
      courseModule.lessons.push({
        id: row.lesson_id,
        title: row.lesson_title,
        summary: row.lesson_summary ?? "",
        contentMarkdown: row.lesson_content_markdown ?? "",
        status: row.lesson_status,
        position: row.lesson_position,
        hasVideo: row.lesson_video_storage_key !== null,
        hasAttachment: row.lesson_attachment_storage_key !== null,
        attachmentFileName: row.lesson_attachment_file_name,
      });
    }
  }

  return [...courses.values()];
}

export async function createAdminCourse(input: {
  title: string;
  description: string;
  levelLabel: string;
  durationLabel: string;
  status: "draft" | "published";
}) {
  if (!validateTitle(input.title)) {
    throw new AdminCourseEditorError("invalid");
  }

  const positionResult = await queryDatabase<{ position: number }>(
    "SELECT COALESCE(MAX(position), 0) + 1 AS position FROM courses",
  );

  const result = await queryDatabase<{ id: string }>(
    `INSERT INTO courses (
       slug,
       title,
       description,
       status,
       position,
       published_at,
       level_label,
       duration_label
     )
     VALUES ($1, $2, $3, $4, $5, CASE WHEN $4 = 'published' THEN now() ELSE NULL END, $6, $7)
     RETURNING id`,
    [
      `${slugifyLibraryTitle(input.title)}-${Date.now().toString(36)}`,
      input.title,
      input.description.slice(0, 800),
      input.status,
      positionResult.rows[0]?.position ?? 1,
      input.levelLabel.slice(0, 80),
      input.durationLabel.slice(0, 80),
    ],
  );
  return result.rows[0].id;
}

export async function updateAdminCourse(input: {
  courseId: string;
  title: string;
  description: string;
  levelLabel: string;
  durationLabel: string;
  status: "draft" | "published";
}) {
  if (!isUuid(input.courseId) || !validateTitle(input.title)) {
    throw new AdminCourseEditorError("invalid");
  }

  const result = await queryDatabase(
    `UPDATE courses
     SET
       title = $2,
       description = $3,
       status = $4,
       published_at = CASE
         WHEN $4 = 'published' AND published_at IS NULL THEN now()
         WHEN $4 = 'draft' THEN NULL
         ELSE published_at
       END,
       level_label = $5,
       duration_label = $6
     WHERE id = $1
       AND status <> 'archived'`,
    [
      input.courseId,
      input.title,
      input.description.slice(0, 800),
      input.status,
      input.levelLabel.slice(0, 80),
      input.durationLabel.slice(0, 80),
    ],
  );

  if (result.rowCount === 0) {
    throw new AdminCourseEditorError("course_not_found");
  }
}

export async function archiveAdminCourse(courseId: string) {
  if (!isUuid(courseId)) {
    throw new AdminCourseEditorError("invalid");
  }

  await queryDatabase(
    `UPDATE courses
     SET status = 'archived'
     WHERE id = $1`,
    [courseId],
  );
}

export async function createAdminModule(input: {
  courseId: string;
  title: string;
  description: string;
}) {
  if (!isUuid(input.courseId) || !validateTitle(input.title)) {
    throw new AdminCourseEditorError("invalid");
  }

  return withDatabaseTransaction(async (client) => {
    const courseResult = await client.query(
      `SELECT 1
       FROM courses
       WHERE id = $1
         AND status <> 'archived'
       LIMIT 1`,
      [input.courseId],
    );

    if (!courseResult.rows[0]) {
      throw new AdminCourseEditorError("course_not_found");
    }

    const positionResult = await client.query<{ position: number }>(
      `SELECT COALESCE(MAX(position), 0) + 1 AS position
       FROM course_modules
       WHERE course_id = $1`,
      [input.courseId],
    );

    const result = await client.query<{ id: string }>(
      `INSERT INTO course_modules (course_id, title, description, position)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        input.courseId,
        input.title,
        input.description.slice(0, 500),
        positionResult.rows[0]?.position ?? 1,
      ],
    );
    return result.rows[0].id;
  });
}

export async function updateAdminModule(input: {
  moduleId: string;
  title: string;
  description: string;
}) {
  if (!isUuid(input.moduleId) || !validateTitle(input.title)) {
    throw new AdminCourseEditorError("invalid");
  }

  const result = await queryDatabase(
    `UPDATE course_modules
     SET title = $2, description = $3
     WHERE id = $1`,
    [input.moduleId, input.title, input.description.slice(0, 500)],
  );

  if (result.rowCount === 0) {
    throw new AdminCourseEditorError("module_not_found");
  }
}

export async function deleteAdminModule(moduleId: string) {
  if (!isUuid(moduleId)) {
    throw new AdminCourseEditorError("invalid");
  }

  await queryDatabase("DELETE FROM course_modules WHERE id = $1", [moduleId]);
}

export async function createAdminLesson(input: {
  moduleId: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  status: "draft" | "published";
  videoStorageKey: string | null;
  attachment:
    | {
        storageKey: string;
        fileName: string;
        mimeType: string;
        fileSizeBytes: number;
      }
    | null;
}) {
  if (!isUuid(input.moduleId) || !validateTitle(input.title)) {
    throw new AdminCourseEditorError("invalid");
  }

  return withDatabaseTransaction(async (client) => {
    const moduleResult = await client.query(
      `SELECT 1
       FROM course_modules
       JOIN courses ON courses.id = course_modules.course_id
       WHERE course_modules.id = $1
         AND courses.status <> 'archived'
       LIMIT 1`,
      [input.moduleId],
    );

    if (!moduleResult.rows[0]) {
      throw new AdminCourseEditorError("module_not_found");
    }

    const positionResult = await client.query<{ position: number }>(
      `SELECT COALESCE(MAX(position), 0) + 1 AS position
       FROM lessons
       WHERE module_id = $1`,
      [input.moduleId],
    );

    const result = await client.query<{ id: string }>(
      `INSERT INTO lessons (
         module_id,
         slug,
         title,
         summary,
         content_markdown,
         video_storage_key,
         attachment_storage_key,
         attachment_file_name,
         attachment_mime_type,
         attachment_file_size_bytes,
         status,
         position
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        input.moduleId,
        `${slugifyLibraryTitle(input.title)}-${Date.now().toString(36)}`,
        input.title,
        input.summary.slice(0, 400),
        input.contentMarkdown.slice(0, 20_000),
        input.videoStorageKey,
        input.attachment?.storageKey ?? null,
        input.attachment?.fileName ?? null,
        input.attachment?.mimeType ?? null,
        input.attachment?.fileSizeBytes ?? null,
        normalizeStatus(input.status),
        positionResult.rows[0]?.position ?? 1,
      ],
    );
    return result.rows[0].id;
  });
}

export async function updateAdminLesson(input: {
  lessonId: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  status: "draft" | "published";
  videoStorageKey?: string;
  attachment?: {
    storageKey: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
  };
}) {
  if (!isUuid(input.lessonId) || !validateTitle(input.title)) {
    throw new AdminCourseEditorError("invalid");
  }

  const result = await queryDatabase(
    `UPDATE lessons
     SET
       title = $2,
       summary = $3,
       content_markdown = $4,
       status = $5,
       video_storage_key = COALESCE($6, video_storage_key),
       attachment_storage_key = COALESCE($7, attachment_storage_key),
       attachment_file_name = COALESCE($8, attachment_file_name),
       attachment_mime_type = COALESCE($9, attachment_mime_type),
       attachment_file_size_bytes = COALESCE($10, attachment_file_size_bytes)
     WHERE id = $1`,
    [
      input.lessonId,
      input.title,
      input.summary.slice(0, 400),
      input.contentMarkdown.slice(0, 20_000),
      normalizeStatus(input.status),
      input.videoStorageKey,
      input.attachment?.storageKey,
      input.attachment?.fileName,
      input.attachment?.mimeType,
      input.attachment?.fileSizeBytes,
    ],
  );

  if (result.rowCount === 0) {
    throw new AdminCourseEditorError("lesson_not_found");
  }
}

export async function getAdminLessonVideoKey(lessonId: string) {
  if (!isUuid(lessonId)) {
    return null;
  }

  const result = await queryDatabase<{ video_storage_key: string | null }>(
    `SELECT video_storage_key
     FROM lessons
     WHERE id = $1
     LIMIT 1`,
    [lessonId],
  );

  return result.rows[0]?.video_storage_key ?? null;
}

export async function getAdminLessonAttachmentKey(lessonId: string) {
  if (!isUuid(lessonId)) {
    return null;
  }

  const result = await queryDatabase<{ attachment_storage_key: string | null }>(
    `SELECT attachment_storage_key
     FROM lessons
     WHERE id = $1
     LIMIT 1`,
    [lessonId],
  );

  return result.rows[0]?.attachment_storage_key ?? null;
}

export async function deleteAdminLesson(lessonId: string) {
  if (!isUuid(lessonId)) {
    throw new AdminCourseEditorError("invalid");
  }

  await queryDatabase("DELETE FROM lessons WHERE id = $1", [lessonId]);
}
