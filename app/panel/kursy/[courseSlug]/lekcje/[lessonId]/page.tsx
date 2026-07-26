import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAccessSession } from "@/app/lib/access";
import {
  getAccessibleLesson,
  isUuid,
} from "@/app/lib/course-content";
import { LessonWorkspace } from "@/components/course/LessonWorkspace";

export default async function LessonPage(
  props: PageProps<"/panel/kursy/[courseSlug]/lekcje/[lessonId]">,
) {
  const session = await getCurrentAccessSession();

  if (!session) {
    redirect("/logowanie?next=/panel");
  }

  const { courseSlug, lessonId } = await props.params;

  if (!isUuid(lessonId)) {
    notFound();
  }

  const lesson = await getAccessibleLesson(
    session.userId,
    session.role,
    courseSlug,
    lessonId,
  );

  if (!lesson) {
    notFound();
  }

  return (
    <section className="lesson-page">
      <div className="container-main">
        <Link
          href={`/panel/kursy/${lesson.courseSlug}`}
          className="back-home-button"
        >
          <span aria-hidden="true">←</span>
          <span>Wróć do kursu</span>
        </Link>
        <LessonWorkspace lesson={lesson} />
      </div>
    </section>
  );
}
