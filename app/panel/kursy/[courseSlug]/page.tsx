import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getAccessibleCourse } from "@/app/lib/course-content";
import { BackHomeLink } from "@/components/BackHomeLink";

export default async function CoursePage(
  props: PageProps<"/panel/kursy/[courseSlug]">,
) {
  const session = await getCurrentAccessSession();

  if (!session) {
    redirect("/logowanie?next=/panel");
  }

  const { courseSlug } = await props.params;
  const course = await getAccessibleCourse(
    session.userId,
    session.role,
    courseSlug,
  );

  if (!course) {
    notFound();
  }

  const lessonCount = course.modules.reduce(
    (total, courseModule) => total + courseModule.lessons.length,
    0,
  );
  const completedCount = course.modules.reduce(
    (total, courseModule) =>
      total + courseModule.lessons.filter((lesson) => lesson.completed).length,
    0,
  );
  const progress =
    lessonCount === 0 ? 0 : Math.round((completedCount / lessonCount) * 100);

  return (
    <section className="course-workspace">
      <div className="container-main">
        <BackHomeLink />
        <div className="course-workspace__header">
          <div>
            <span className="eyebrow">Twój kurs</span>
            <h1>{course.title}</h1>
            <p>{course.description}</p>
          </div>
          <div className="course-workspace__progress">
            <strong>{progress}%</strong>
            <span>
              Ukończono {completedCount} z {lessonCount} lekcji
            </span>
            <progress
              className="access-progress-bar"
              value={progress}
              max={100}
              aria-label={`Postęp kursu: ${progress} procent`}
            />
          </div>
        </div>

        <div className="course-modules">
          {course.modules.map((courseModule) => (
            <section key={courseModule.id} className="course-module">
              <div className="course-module__heading">
                <span>Moduł {courseModule.position}</span>
                <h2>{courseModule.title}</h2>
                {courseModule.description ? (
                  <p>{courseModule.description}</p>
                ) : null}
              </div>
              <div className="course-lessons">
                {courseModule.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/panel/kursy/${course.slug}/lekcje/${lesson.id}`}
                    className="course-lesson-row"
                  >
                    <span
                      className={
                        lesson.completed
                          ? "course-lesson-row__state course-lesson-row__state--done"
                          : "course-lesson-row__state"
                      }
                      aria-hidden="true"
                    >
                      {lesson.completed ? "✓" : lesson.position}
                    </span>
                    <span className="course-lesson-row__copy">
                      <strong>{lesson.title}</strong>
                      <span>{lesson.summary}</span>
                    </span>
                    <span className="course-lesson-row__action">
                      {lesson.completed ? "Powtórz" : "Otwórz"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="course-workspace__footer">
          <Link href="/panel" className="button-secondary">
            Wróć do panelu
          </Link>
        </div>
      </div>
    </section>
  );
}
