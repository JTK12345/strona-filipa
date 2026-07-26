import "server-only";

import { queryDatabase } from "@/app/lib/db";
import type { UserRole } from "@/app/lib/session";

type CourseAccessRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
};

type CourseLessonRow = {
  module_id: string;
  module_title: string;
  module_description: string;
  module_position: number;
  lesson_id: string | null;
  lesson_title: string | null;
  lesson_summary: string | null;
  lesson_position: number | null;
  video_duration_seconds: number | null;
  progress_seconds: number | null;
  completed_at: Date | null;
};

type LessonRow = {
  id: string;
  course_id: string;
  course_slug: string;
  course_title: string;
  module_title: string;
  title: string;
  summary: string;
  content_markdown: string;
  video_storage_key: string | null;
  video_duration_seconds: number | null;
  progress_seconds: number | null;
  completed_at: Date | null;
  note_content: string | null;
};

export type CourseModule = {
  id: string;
  title: string;
  description: string;
  position: number;
  lessons: Array<{
    id: string;
    title: string;
    summary: string;
    position: number;
    videoDurationSeconds: number | null;
    progressSeconds: number;
    completed: boolean;
  }>;
};

export type AccessibleCourse = CourseAccessRow & {
  modules: CourseModule[];
};

export type AccessibleLesson = {
  id: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  moduleTitle: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  hasVideo: boolean;
  videoDurationSeconds: number | null;
  progressSeconds: number;
  completed: boolean;
  note: string;
};

function accessPredicate(alias = "courses") {
  return `
    (
      $2::boolean
      OR EXISTS (
        SELECT 1
        FROM access_grants
        WHERE access_grants.user_id = $1
          AND access_grants.revoked_at IS NULL
          AND (
            access_grants.expires_at IS NULL
            OR access_grants.expires_at > now()
          )
          AND (
            access_grants.scope = 'all_access'
            OR (
              access_grants.scope = 'course'
              AND access_grants.course_id = ${alias}.id
            )
          )
      )
    )
  `;
}

function isAdmin(role: UserRole) {
  return role === "admin";
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function getAccessibleCourse(
  userId: string,
  role: UserRole,
  courseSlug: string,
): Promise<AccessibleCourse | null> {
  const admin = isAdmin(role);
  const courseResult = await queryDatabase<CourseAccessRow>(
    `SELECT id, slug, title, description
     FROM courses
     WHERE slug = $3
       AND status <> 'archived'
       AND ${accessPredicate()}
     LIMIT 1`,
    [userId, admin, courseSlug],
  );
  const course = courseResult.rows[0];

  if (!course) {
    return null;
  }

  const lessonsResult = await queryDatabase<CourseLessonRow>(
    `SELECT
       course_modules.id AS module_id,
       course_modules.title AS module_title,
       course_modules.description AS module_description,
       course_modules.position AS module_position,
       lessons.id AS lesson_id,
       lessons.title AS lesson_title,
       lessons.summary AS lesson_summary,
       lessons.position AS lesson_position,
       lessons.video_duration_seconds,
       lesson_progress.progress_seconds,
       lesson_progress.completed_at
     FROM course_modules
     LEFT JOIN lessons
       ON lessons.module_id = course_modules.id
       AND ($2::boolean OR lessons.status = 'published')
     LEFT JOIN lesson_progress
       ON lesson_progress.lesson_id = lessons.id
       AND lesson_progress.user_id = $1
     WHERE course_modules.course_id = $3
     ORDER BY course_modules.position, lessons.position`,
    [userId, admin, course.id],
  );
  const modules = new Map<string, CourseModule>();

  for (const row of lessonsResult.rows) {
    let courseModule = modules.get(row.module_id);

    if (!courseModule) {
      courseModule = {
        id: row.module_id,
        title: row.module_title,
        description: row.module_description,
        position: row.module_position,
        lessons: [],
      };
      modules.set(row.module_id, courseModule);
    }

    if (row.lesson_id && row.lesson_title && row.lesson_position !== null) {
      courseModule.lessons.push({
        id: row.lesson_id,
        title: row.lesson_title,
        summary: row.lesson_summary ?? "",
        position: row.lesson_position,
        videoDurationSeconds: row.video_duration_seconds,
        progressSeconds: row.progress_seconds ?? 0,
        completed: row.completed_at !== null,
      });
    }
  }

  return {
    ...course,
    modules: [...modules.values()],
  };
}

export async function getAccessibleLesson(
  userId: string,
  role: UserRole,
  courseSlug: string,
  lessonId: string,
): Promise<AccessibleLesson | null> {
  const result = await queryDatabase<LessonRow>(
    `SELECT
       lessons.id,
       courses.id AS course_id,
       courses.slug AS course_slug,
       courses.title AS course_title,
       course_modules.title AS module_title,
       lessons.title,
       lessons.summary,
       lessons.content_markdown,
       lessons.video_storage_key,
       lessons.video_duration_seconds,
       lesson_progress.progress_seconds,
       lesson_progress.completed_at,
       user_notes.content AS note_content
     FROM lessons
     JOIN course_modules ON course_modules.id = lessons.module_id
     JOIN courses ON courses.id = course_modules.course_id
     LEFT JOIN lesson_progress
       ON lesson_progress.lesson_id = lessons.id
       AND lesson_progress.user_id = $1
     LEFT JOIN user_notes
       ON user_notes.lesson_id = lessons.id
       AND user_notes.user_id = $1
     WHERE lessons.id = $4
       AND courses.slug = $3
       AND courses.status <> 'archived'
       AND ($2::boolean OR lessons.status = 'published')
       AND ${accessPredicate()}
     LIMIT 1`,
    [userId, isAdmin(role), courseSlug, lessonId],
  );
  const lesson = result.rows[0];

  if (!lesson) {
    return null;
  }

  return {
    id: lesson.id,
    courseId: lesson.course_id,
    courseSlug: lesson.course_slug,
    courseTitle: lesson.course_title,
    moduleTitle: lesson.module_title,
    title: lesson.title,
    summary: lesson.summary,
    contentMarkdown: lesson.content_markdown,
    hasVideo: lesson.video_storage_key !== null,
    videoDurationSeconds: lesson.video_duration_seconds,
    progressSeconds: lesson.progress_seconds ?? 0,
    completed: lesson.completed_at !== null,
    note: lesson.note_content ?? "",
  };
}

export async function getAccessibleLessonMedia(
  userId: string,
  role: UserRole,
  lessonId: string,
) {
  const result = await queryDatabase<{
    storage_key: string;
  }>(
    `SELECT lessons.video_storage_key AS storage_key
     FROM lessons
     JOIN course_modules ON course_modules.id = lessons.module_id
     JOIN courses ON courses.id = course_modules.course_id
     WHERE lessons.id = $3
       AND lessons.video_storage_key IS NOT NULL
       AND courses.status <> 'archived'
       AND ($2::boolean OR lessons.status = 'published')
       AND ${accessPredicate()}
     LIMIT 1`,
    [userId, isAdmin(role), lessonId],
  );

  return result.rows[0] ?? null;
}

export async function canAccessLesson(
  userId: string,
  role: UserRole,
  lessonId: string,
) {
  const result = await queryDatabase(
    `SELECT 1
     FROM lessons
     JOIN course_modules ON course_modules.id = lessons.module_id
     JOIN courses ON courses.id = course_modules.course_id
     WHERE lessons.id = $3
       AND courses.status <> 'archived'
       AND ($2::boolean OR lessons.status = 'published')
       AND ${accessPredicate()}
     LIMIT 1`,
    [userId, isAdmin(role), lessonId],
  );

  return Boolean(result.rows[0]);
}
