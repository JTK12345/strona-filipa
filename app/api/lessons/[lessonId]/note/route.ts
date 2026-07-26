import { isSameOriginFormRequest } from "@/app/lib/auth";
import { canAccessLesson, isUuid } from "@/app/lib/course-content";
import { queryDatabase } from "@/app/lib/db";
import { getCurrentUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

const maxBodyBytes = 12 * 1024;
const maxNoteLength = 5000;

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

  let content: unknown;

  try {
    content = (JSON.parse(rawBody) as { content?: unknown }).content;
  } catch {
    return Response.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  if (typeof content !== "string" || content.length > maxNoteLength) {
    return Response.json({ error: "Nieprawidłowa notatka." }, { status: 400 });
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
    `INSERT INTO user_notes (user_id, lesson_id, content)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, lesson_id)
       WHERE lesson_id IS NOT NULL
     DO UPDATE SET
       content = EXCLUDED.content,
       updated_at = now()`,
    [session.userId, lessonId, content.trim()],
  );

  return Response.json({ ok: true });
}
