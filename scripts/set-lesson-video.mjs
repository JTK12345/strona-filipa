import { stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const allowedExtensions = new Set([".mp4", ".m4v", ".webm"]);

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const courseSlug = argument("course");
const lessonSlug = argument("lesson");
const storageKey = argument("file");
const durationSeconds = Number(argument("duration"));
const databaseUrl = process.env.DATABASE_URL;
const storageRoot = path.resolve(
  process.env.VIDEO_STORAGE_PATH ?? "/data/videos",
);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

if (!courseSlug || !lessonSlug || !storageKey) {
  throw new Error(
    "Usage: --course <slug> --lesson <slug> --file <relative-path> --duration <seconds>",
  );
}

if (
  !Number.isSafeInteger(durationSeconds) ||
  durationSeconds <= 0 ||
  durationSeconds > 24 * 60 * 60
) {
  throw new Error("--duration must be an integer between 1 and 86400.");
}

const normalizedStorageKey = storageKey.replaceAll("\\", "/");
const extension = path.extname(normalizedStorageKey).toLowerCase();
const filePath = path.resolve(storageRoot, normalizedStorageKey);
const relativePath = path.relative(storageRoot, filePath);

if (
  !allowedExtensions.has(extension) ||
  !relativePath ||
  relativePath.startsWith("..") ||
  path.isAbsolute(relativePath)
) {
  throw new Error("The video path must be a relative MP4, M4V, or WebM path.");
}

const fileStats = await stat(filePath).catch(() => null);

if (!fileStats?.isFile()) {
  throw new Error(`Video file does not exist: ${filePath}`);
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 });

try {
  const result = await pool.query(
    `UPDATE lessons
     SET
       video_storage_key = $3,
       video_duration_seconds = $4,
       updated_at = now()
     FROM course_modules, courses
     WHERE lessons.module_id = course_modules.id
       AND course_modules.course_id = courses.id
       AND courses.slug = $1
       AND lessons.slug = $2
     RETURNING lessons.id, lessons.title`,
    [courseSlug, lessonSlug, normalizedStorageKey, durationSeconds],
  );

  if (result.rowCount !== 1) {
    throw new Error(
      `Expected exactly one lesson, updated ${result.rowCount ?? 0}.`,
    );
  }

  console.log(
    `Video assigned to lesson: ${result.rows[0].title} (${result.rows[0].id})`,
  );
} finally {
  await pool.end();
}
