"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { AdminCourseEditorCourse, AdminCourseEditorLesson, AdminCourseEditorModule } from "@/app/lib/admin-course-editor";
import { courseEditorMessages, isCourseEditorSuccess } from "@/app/lib/course-editor-feedback";

type EditorTarget = {
  kind: "course" | "module" | "lesson";
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  remove?: boolean;
};

type SaveResult = {
  result: string;
  entityId?: string;
  courses?: AdminCourseEditorCourse[];
  refreshRequired?: boolean;
};

const statusLabel = (status: string) => status === "published" ? "Opublikowany" : "Szkic";

export function CourseManager({
  initialCourses,
  initialCourseId,
}: {
  initialCourses: AdminCourseEditorCourse[];
  initialCourseId: string;
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [selectedId, setSelectedId] = useState(initialCourses.find((item) => item.id === initialCourseId)?.id || initialCourses[0]?.id || "");
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<EditorTarget | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const picker = useRef<HTMLSelectElement>(null);
  const course = courses.find((item) => item.id === selectedId);
  const query = search.trim().toLocaleLowerCase("pl");

  function edit(next: EditorTarget) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setTarget(next);
  }

  function close() {
    setTarget(null);
    requestAnimationFrame(() => {
      const element = opener.current?.isConnected ? opener.current : picker.current;
      element?.focus({ preventScroll: true });
    });
  }

  function saved(data: SaveResult, edited: EditorTarget) {
    if (data.courses) setCourses(data.courses);
    if (data.result === "course_created" && data.entityId) {
      setSelectedId(data.entityId);
      setSearch("");
    }
    if (data.result === "course_archived") {
      setSelectedId(data.courses?.[0]?.id ?? "");
      setSearch("");
    }
    const moduleId = data.result === "module_created" ? data.entityId : edited.moduleId;
    if (moduleId && data.result !== "module_deleted") {
      setOpenModules((current) => new Set(current).add(moduleId));
    }
    if (data.result.endsWith("_created")) setSearch("");
  }

  return (
    <div className="course-manager">
      <div className="course-manager__toolbar">
        <label>
          <span>Kurs do edycji</span>
          <select ref={picker} value={selectedId} onChange={(event) => {
            setSelectedId(event.target.value);
            setSearch("");
          }}>
            {!courses.length && <option value="">Brak kursów</option>}
            {courses.map((item) => <option key={item.id} value={item.id}>{item.title} · {statusLabel(item.status)}</option>)}
          </select>
        </label>
        <button className="button-primary" type="button" onClick={() => edit({ kind: "course" })}>+ Nowy kurs</button>
      </div>

      {course ? (
        <article className="course-workbench" aria-label={`Edytor kursu: ${course.title}`}>
          <div className="course-workbench__heading">
            <div>
              <p className="meta-label">Kurs</p>
              <h3>{course.title}</h3>
              <p className="course-workbench__description">{course.description || "Dodaj opis, który przybliży uczestnikom cel kursu."}</p>
              <div className="course-workbench__meta">
                <span className={`status-badge status-badge--${course.status}`}>{statusLabel(course.status)}</span>
                <span>Moduły: {course.modules.length}</span>
                <span>Lekcje: {course.modules.reduce((sum, item) => sum + item.lessons.length, 0)}</span>
              </div>
            </div>
            <div className="course-manager__actions">
              <button type="button" className="button-secondary" onClick={() => edit({ kind: "course", courseId: course.id })}>Edytuj dane kursu</button>
              <button type="button" className="course-text-button" onClick={() => edit({ kind: "course", courseId: course.id, remove: true })}>Usuń kurs</button>
            </div>
          </div>

          <div className="course-workbench__tools">
            <div><h4>Moduły kursu</h4><p>Rozwiń moduł, aby zobaczyć jego lekcje.</p></div>
            <button type="button" className="button-primary" onClick={() => edit({ kind: "module", courseId: course.id })}>+ Dodaj moduł do kursu</button>
          </div>

          {course.modules.length > 0 && (
            <div className="course-workbench__filters">
              <label><span>Szukaj modułu lub lekcji</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Wpisz nazwę lub fragment opisu" /></label>
              <div className="course-manager__actions">
                <button type="button" className="course-text-button" onClick={() => setOpenModules(new Set(course.modules.map((item) => item.id)))}>Rozwiń wszystkie</button>
                <button type="button" className="course-text-button" onClick={() => { setOpenModules(new Set()); setSearch(""); }}>Zwiń wszystkie</button>
              </div>
            </div>
          )}

          <div className="course-editor-module-list">
            {course.modules.map((module) => {
              const matchesModule = `${module.title} ${module.description}`.toLocaleLowerCase("pl").includes(query);
              const lessons = !query || matchesModule ? module.lessons : module.lessons.filter((lesson) => `${lesson.title} ${lesson.summary}`.toLocaleLowerCase("pl").includes(query));
              if (query && !matchesModule && !lessons.length) return null;
              const expanded = Boolean(query) || openModules.has(module.id);
              return (
                <section className="course-editor-module" key={module.id} aria-label={`Moduł ${module.position}: ${module.title}`}>
                  <div className="course-editor-module__heading">
                    <button type="button" className="course-editor-module__toggle" aria-expanded={expanded} aria-controls={`module-lessons-${module.id}`} onClick={() => {
                      setSearch("");
                      setOpenModules((current) => {
                        const next = new Set(current);
                        if (expanded) next.delete(module.id); else next.add(module.id);
                        return next;
                      });
                    }}>
                      <span className="course-editor-module__chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
                      <span><span className="meta-label">Moduł {module.position} · Lekcje: {module.lessons.length}</span><strong>{module.title}</strong></span>
                    </button>
                    <div className="course-manager__actions">
                      <button type="button" className="course-text-button" onClick={() => edit({ kind: "module", courseId: course.id, moduleId: module.id })}>Edytuj moduł</button>
                      <button type="button" className="button-secondary" onClick={() => edit({ kind: "lesson", courseId: course.id, moduleId: module.id })}>+ Dodaj lekcję</button>
                      <button type="button" className="course-text-button course-delete-button" aria-label={`Usuń moduł: ${module.title}`} onClick={() => edit({ kind: "module", courseId: course.id, moduleId: module.id, remove: true })}>Usuń moduł</button>
                    </div>
                  </div>
                  <div id={`module-lessons-${module.id}`} hidden={!expanded} className="course-editor-module__body">
                    {module.description && <p className="course-workbench__description">{module.description}</p>}
                    <p className="meta-label">Lekcje w module „{module.title}”</p>
                    <ol className="course-editor-lessons">
                      {lessons.map((lesson) => (
                        <li key={lesson.id} className="course-editor-lesson">
                          <span className="course-editor-lesson__number" aria-hidden="true">{module.position}.{lesson.position}</span>
                          <div className="course-editor-lesson__copy">
                            <h5>{lesson.title}</h5>
                            {lesson.summary && <p>{lesson.summary}</p>}
                            <span>{lesson.status === "published" ? "Opublikowana" : "Szkic"} · {lesson.hasVideo ? "Film dodany" : "Bez filmu"}{lesson.hasAttachment ? " · Załącznik dodany" : ""}</span>
                          </div>
                          <div className="course-editor-lesson__actions">
                            <button type="button" className="button-secondary" aria-label={`Edytuj lekcję: ${lesson.title}`} onClick={() => edit({ kind: "lesson", courseId: course.id, moduleId: module.id, lessonId: lesson.id })}>Edytuj lekcję</button>
                            <button type="button" className="course-text-button course-delete-button" aria-label={`Usuń lekcję: ${lesson.title}`} onClick={() => edit({ kind: "lesson", courseId: course.id, moduleId: module.id, lessonId: lesson.id, remove: true })}>Usuń lekcję</button>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {!module.lessons.length && <p className="course-manager__empty">Ten moduł nie ma jeszcze lekcji. Użyj „Dodaj lekcję” w nagłówku modułu.</p>}
                  </div>
                </section>
              );
            })}
            {!course.modules.length && <p className="course-manager__empty">Kurs jest gotowy na pierwszą część. Dodaj moduł, a następnie umieść w nim lekcje.</p>}
            {query && !course.modules.some((module) => `${module.title} ${module.description}`.toLocaleLowerCase("pl").includes(query) || module.lessons.some((lesson) => `${lesson.title} ${lesson.summary}`.toLocaleLowerCase("pl").includes(query))) && <p className="course-manager__empty" role="status">Nie znaleziono modułów ani lekcji. Zmień wyszukiwanie.</p>}
          </div>
        </article>
      ) : <p className="course-manager__empty">Zacznij od „Nowy kurs”. Następnie dodaj moduły i lekcje wewnątrz każdego modułu.</p>}

      {target && <CourseEditorDialog initialTarget={target} courses={courses} onSaved={saved} onClose={close} />}
    </div>
  );
}

function CourseEditorDialog({ initialTarget, courses, onSaved, onClose }: {
  initialTarget: EditorTarget;
  courses: AdminCourseEditorCourse[];
  onSaved: (data: SaveResult, target: EditorTarget) => void;
  onClose: () => void;
}) {
  const [target, setTarget] = useState(initialTarget);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [refreshRequired, setRefreshRequired] = useState(false);
  const pending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const contextId = useId();
  const course = courses.find((item) => item.id === target.courseId);
  const currentModule = course?.modules.find((item) => item.id === target.moduleId);
  const lesson = currentModule?.lessons.find((item) => item.id === target.lessonId);
  const existing = target.kind === "course" ? course : target.kind === "module" ? currentModule : lesson;
  const removing = Boolean(target.remove);
  const deleted = /_(deleted|archived)$/.test(result);
  const title = removing
    ? `Usuń ${target.kind === "course" ? "kurs" : target.kind === "module" ? "moduł" : "lekcję"}`
    : target.kind === "course" ? (course ? "Edytuj dane kursu" : "Nowy kurs")
      : target.kind === "module" ? (currentModule ? "Edytuj moduł" : "Nowy moduł")
        : lesson ? "Edytuj lekcję" : "Nowa lekcja";

  useEffect(() => {
    const node = dialog.current!;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const overflow = document.body.style.overflow;
    const padding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbar}px`;
    node.showModal();
    node.querySelector<HTMLInputElement>('input[name="title"]')?.focus({ preventScroll: true });
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = padding;
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    };
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty || pending.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function close() {
    if (pending.current) return;
    if (dirty && !window.confirm("Zamknąć formularz i odrzucić niezapisane zmiany?")) return;
    onClose();
  }

  function next(nextTarget: EditorTarget) {
    if (dirty && !window.confirm("Odrzucić niezapisane zmiany i otworzyć nowy formularz?")) return;
    setTarget(nextTarget);
    setRevision((value) => value + 1);
    setDirty(false);
    setResult("");
    setError("");
    requestAnimationFrame(() => {
      dialog.current?.querySelector<HTMLInputElement>('input[name="title"]')?.focus({ preventScroll: true });
      dialog.current?.querySelector(".course-dialog__body")?.scrollTo({ top: 0 });
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || refreshRequired) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const action = removing ? (target.kind === "course" ? "archive-course" : `delete-${target.kind}`) : `${existing ? "update" : "create"}-${target.kind}`;
    data.set("action", action);
    if (target.courseId) { data.set("courseId", target.courseId); data.set("editCourse", target.courseId); }
    if (target.moduleId) data.set("moduleId", target.moduleId);
    if (target.lessonId) data.set("lessonId", target.lessonId);
    pending.current = true;
    setBusy(true);
    setError("");
    setResult("");
    try {
      const response = await fetch("/api/admin/courses", { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (response.status === 403 || response.redirected) {
        setError("Sesja wygasła lub nie masz uprawnień. Zaloguj się ponownie w drugiej karcie, a potem wróć do tego formularza.");
        return;
      }
      const payload: SaveResult = await response.json();
      if (!response.ok || !isCourseEditorSuccess(payload.result)) {
        setError(courseEditorMessages[payload.result] ?? courseEditorMessages.server);
        return;
      }
      onSaved(payload, target);
      if (payload.entityId) setTarget({ ...target, [target.kind === "course" ? "courseId" : target.kind === "module" ? "moduleId" : "lessonId"]: payload.entityId });
      setResult(payload.result);
      setRefreshRequired(Boolean(payload.refreshRequired));
      setDirty(false);
      // Avoid re-uploading an already saved file during another text edit.
      form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => { input.value = ""; });
    } catch {
      setError("Nie udało się potwierdzić zapisu. Sprawdź połączenie i stan kursu przed ponowną próbą. Wpisane dane pozostają w formularzu.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const saveLabel = removing ? title : target.kind === "course" ? (existing ? "Zapisz kurs" : "Utwórz kurs") : target.kind === "module" ? (existing ? "Zapisz moduł" : "Dodaj moduł") : existing ? "Zapisz lekcję" : "Dodaj lekcję";

  return (
    <dialog ref={dialog} className="course-dialog" aria-labelledby={headingId} aria-describedby={contextId} onCancel={(event) => { event.preventDefault(); close(); }}>
      <div className="course-dialog__heading">
        <div><h2 id={headingId}>{title}</h2><p id={contextId}>{course ? `Kurs: ${course.title}` : "Najpierw utwórz kurs, potem dodaj moduły i lekcje."}{currentModule ? ` → Moduł: ${currentModule.title}` : ""}{lesson ? ` → Lekcja: ${lesson.title}` : ""}</p></div>
        <button type="button" className="course-text-button" aria-label="Zamknij edytor" disabled={busy} onClick={close}>✕</button>
      </div>
      <form onSubmit={submit} onChange={() => { setDirty(true); setResult(""); }} className="course-dialog__form">
        <div className="course-dialog__body">
          {!deleted && <fieldset key={revision} disabled={busy || refreshRequired} className="course-dialog__fields">
            {removing ? <p role="alert">Potwierdź usunięcie „{existing?.title}”. {target.kind === "module" ? "Zostaną usunięte także wszystkie lekcje i pliki tego modułu." : target.kind === "lesson" ? "Zostaną usunięte także pliki tej lekcji." : "Kurs przestanie być widoczny na stronie."}</p> : <>
              <label><span>{target.kind === "course" ? "Nazwa kursu" : target.kind === "module" ? "Nazwa modułu" : "Tytuł lekcji"} <small>(wymagane)</small></span><input name="title" required minLength={3} maxLength={160} defaultValue={existing?.title ?? ""} /></label>
              {target.kind === "course" && <CourseFields course={course} />}
              {target.kind === "module" && <ModuleFields module={currentModule} />}
              {target.kind === "lesson" && <LessonFields lesson={lesson} />}
            </>}
          </fieldset>}
        </div>
        <div className="course-dialog__footer">
          {error && <p className="auth-error" role="alert">{error}</p>}
          {result && <p className="auth-notice" role="status">{courseEditorMessages[result]}</p>}
          {refreshRequired && <p role="alert">Zmiany zapisano, ale nie udało się odczytać nowej listy. <button type="button" className="course-text-button" onClick={() => window.location.reload()}>Odśwież dane</button></p>}
          <div className="course-dialog__actions">
            <button type="button" className="button-secondary" disabled={busy} onClick={close}>{result ? "Gotowe" : "Anuluj"}</button>
            {!deleted && !refreshRequired && <button type="submit" className={removing ? "button-primary course-delete-confirm" : "button-primary"} disabled={busy}>{busy ? "Zapisywanie…" : saveLabel}</button>}
            {!refreshRequired && result === "course_created" && <button type="button" className="button-secondary" onClick={() => next({ kind: "module", courseId: target.courseId })}>Dodaj pierwszy moduł</button>}
            {!refreshRequired && result === "module_created" && <button type="button" className="button-secondary" onClick={() => next({ kind: "lesson", courseId: target.courseId, moduleId: target.moduleId })}>Dodaj lekcję do modułu</button>}
            {!refreshRequired && result === "lesson_created" && <button type="button" className="button-secondary" onClick={() => next({ kind: "lesson", courseId: target.courseId, moduleId: target.moduleId })}>Dodaj kolejną lekcję</button>}
            {lesson && !removing && !busy && !refreshRequired && <button type="button" className="course-text-button" onClick={() => next({ ...target, remove: true })}>Usuń lekcję</button>}
          </div>
        </div>
      </form>
    </dialog>
  );
}

function CourseFields({ course }: { course?: AdminCourseEditorCourse }) {
  return <>
    <label><span>Opis kursu</span><textarea name="description" rows={3} maxLength={800} defaultValue={course?.description ?? ""} /></label>
    <div className="course-dialog__columns">
      <label><span>Poziom</span><input name="levelLabel" maxLength={80} placeholder="np. Start" defaultValue={course?.levelLabel ?? ""} /></label>
      <label><span>Czas / liczba modułów</span><input name="durationLabel" maxLength={80} placeholder="np. 4 moduły" defaultValue={course?.durationLabel ?? ""} /></label>
    </div>
    <label><span>Status kursu</span><select name="status" defaultValue={course?.status === "published" ? "published" : "draft"}><option value="draft">Szkic</option><option value="published">Opublikowany</option></select></label>
  </>;
}

function ModuleFields({ module }: { module?: AdminCourseEditorModule }) {
  return <label><span>Opis modułu</span><textarea name="description" rows={4} maxLength={500} defaultValue={module?.description ?? ""} /></label>;
}

function LessonFields({ lesson }: { lesson?: AdminCourseEditorLesson }) {
  return <>
    <label><span>Krótki opis</span><textarea name="summary" rows={2} maxLength={400} defaultValue={lesson?.summary ?? ""} /></label>
    <label><span>Treść instrukcji</span><textarea name="contentMarkdown" rows={6} maxLength={20000} defaultValue={lesson?.contentMarkdown ?? ""} /></label>
    <div className="course-dialog__columns">
      <label><span>{lesson?.hasVideo ? "Podmień film" : "Film lekcji"}</span><input name="video" type="file" accept=".mp4,.webm,video/mp4,video/webm" /><small>MP4 lub WebM, maks. 1200 MB. {lesson?.hasVideo ? "Film jest dodany. Pozostaw pole puste, aby go zachować." : "Pole opcjonalne."}</small></label>
      <label><span>{lesson?.hasAttachment ? "Podmień plik do pobrania" : "Plik do pobrania"}</span><input name="attachment" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" /><small>PDF, DOCX, JPG lub PNG, maks. 200 MB. {lesson?.hasAttachment ? `Obecny plik: ${lesson.attachmentFileName ?? "załącznik"}. Pozostaw pole puste, aby go zachować.` : "Pole opcjonalne."}</small></label>
    </div>
    <label><span>Status lekcji</span><select name="status" defaultValue={lesson?.status ?? "draft"}><option value="draft">Szkic</option><option value="published">Opublikowana</option></select></label>
  </>;
}
