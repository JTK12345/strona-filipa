import { isSameOriginFormRequest } from "@/app/lib/auth";
import { canAccessLesson, isUuid } from "@/app/lib/course-content";
import { queryDatabase } from "@/app/lib/db";
import { getCurrentUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

const maxBodyBytes = 2048;
const maxProgressSeconds = 24 * 60 * 60;

type ProgressInput = {
  progressSeconds?: unknown;
  completed?: unknown;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  if (!isSameOriginFormRequest(request)) {
    return Response.json({ error: "Żądanie zostało odrzucone." }, { status: 403 });
  }

  const session = await getCurrentUserSession();

  if (!session) {
    return Response.json({ error: "Wymagane jest logowanie." }, { status: 401 });
  }

  const { lessonId } = await context.params;

  if (!isUuid(lessonId)) {
    return Response.json({ error: "Nie znaleziono lekcji." }, { status: 404 });
  }

  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > maxBodyBytes) {
    return Response.json({ error: "Żądanie jest zbyt duże." }, { status: 413 });
  }

  let input: ProgressInput;

  try {
    input = JSON.parse(rawBody) as ProgressInput;
  } catch {
    return Response.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  if (
    !Number.isSafeInteger(input.progressSeconds) ||
    Number(input.progressSeconds) < 0 ||
    Number(input.progressSeconds) > maxProgressSeconds ||
    typeof input.completed !== "boolean"
  ) {
    return Response.json({ error: "Nieprawidłowy postęp lekcji." }, { status: 400 });
  }

  const hasAccess = await canAccessLesson(
    session.userId,
    session.role,
    lessonId,
  );

  if (!hasAccess) {
    return Response.json({ error: "Nie znaleziono lekcji." }, { status: 404 });
  }

  await queryDatabase(
    `INSERT INTO lesson_progress (
       user_id,
       lesson_id,
       progress_seconds,
       completed_at
     )
     VALUES ($1, $2, $3, CASE WHEN $4::boolean THEN now() ELSE NULL END)
     ON CONFLICT (user_id, lesson_id)
     DO UPDATE SET
       progress_seconds = EXCLUDED.progress_seconds,
       completed_at = EXCLUDED.completed_at,
       updated_at = now()`,
    [session.userId, lessonId, input.progressSeconds, input.completed],
  );

  return Response.json({ ok: true, completed: input.completed });
}
