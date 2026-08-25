import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDashboard } from "@/app/lib/admin";
import { listAccessCodes } from "@/app/lib/access-codes";
import { getAdminCourseEditor } from "@/app/lib/admin-course-editor";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getAdminLibraryItems } from "@/app/lib/library";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Administracja | Świadomy Profil Ciała",
  robots: { index: false, follow: false },
};

const grantMessages: Record<string, string> = {
  success: "Dostęp został nadany i zapisany w dzienniku audytowym.",
  invalid: "Sprawdź adres e-mail i wybrany zakres dostępu.",
  user_not_found: "Nie znaleziono aktywnego użytkownika z tym adresem e-mail.",
  course_not_found: "Wybrany kurs nie istnieje lub jest zarchiwizowany.",
  already_granted: "Ten użytkownik ma już taki dostęp.",
  server: "Nie udało się nadać dostępu. Spróbuj ponownie.",
  rate: "Wykonano zbyt wiele operacji. Odczekaj kilka minut.",
};

const accessCodeMessages: Record<string, string> = {
  created: "Kod został utworzony. Skopiuj go teraz, bo później nie będzie już pokazany.",
  revoked: "Kod został wyłączony.",
  invalid: "Sprawdź dane kodu.",
  rate: "Wykonano zbyt wiele operacji. Odczekaj kilka minut.",
};

const materialMessages: Record<string, string> = {
  created: "Materiał został dodany do biblioteki.",
  updated: "Materiał został zaktualizowany.",
  archived: "Materiał został usunięty z widocznej biblioteki.",
  invalid: "Uzupełnij tytuł oraz treść albo plik.",
  file: "Ten typ pliku jest niedozwolony albo plik jest zbyt duży.",
  rate: "Wykonano zbyt wiele operacji. Odczekaj kilka minut.",
};

const roleMessages: Record<string, string> = {
  granted: "Uprawnienia administratora zostały nadane.",
  revoked: "Uprawnienia administratora zostały odebrane.",
  invalid: "Nieprawidłowa operacja użytkownika.",
  user_not_found: "Nie znaleziono aktywnego użytkownika.",
  already_admin: "Ten użytkownik jest już administratorem.",
  already_user: "Ten użytkownik nie ma uprawnień administratora.",
  last_admin: "Nie można odebrać uprawnień ostatniemu administratorowi.",
  server: "Nie udało się zmienić uprawnień użytkownika.",
  rate: "Wykonano zbyt wiele operacji. Odczekaj kilka minut.",
};

const courseMessages: Record<string, string> = {
  course_created: "Kurs został utworzony.",
  course_updated: "Kurs został zaktualizowany.",
  course_archived: "Kurs został usunięty ze strony.",
  module_created: "Moduł został dodany.",
  module_updated: "Moduł został zaktualizowany.",
  module_deleted: "Moduł został usunięty.",
  lesson_created: "Lekcja została dodana.",
  lesson_updated: "Lekcja została zaktualizowana.",
  lesson_deleted: "Lekcja została usunięta.",
  invalid: "Sprawdź dane kursu, modułu albo lekcji.",
  course_not_found: "Nie znaleziono kursu.",
  module_not_found: "Nie znaleziono modułu.",
  lesson_not_found: "Nie znaleziono lekcji.",
  server: "Nie udało się zapisać zmian w kursie.",
  rate: "Wykonano zbyt wiele operacji. Odczekaj kilka minut.",
};

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(value)
    : "—";
}

function formatFileSize(value: number | null) {
  if (value === null) {
    return "bez pliku";
  }

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatAccessScope(code: {
  scope: "library" | "all_access" | "course";
  course_title: string | null;
}) {
  if (code.scope === "course") {
    return code.course_title ? `Kurs: ${code.course_title}` : "Kurs";
  }

  if (code.scope === "library") {
    return "Biblioteka";
  }

  return "Cała platforma";
}

export type AdminSection =
  | "kody"
  | "kursy"
  | "materialy"
  | "uzytkownicy"
  | "dostepy"
  | "audyt";

export async function AdminPanelPage({
  section,
  searchParams,
}: {
  section: AdminSection;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentAccessSession();
  const resolvedSearchParams = await searchParams;

  if (!session) {
    redirect("/logowanie?next=/panel");
  }

  if (session.role !== "admin") {
    redirect("/panel");
  }

  const [dashboard, accessCodes, libraryItems, courseEditor] = await Promise.all([
    getAdminDashboard(),
    listAccessCodes(),
    getAdminLibraryItems(),
    getAdminCourseEditor(),
  ]);

  const grantResult =
    typeof resolvedSearchParams.grant === "string" ? resolvedSearchParams.grant : "";
  const grantMessage = grantMessages[grantResult];
  const accessCodeResult =
    typeof resolvedSearchParams.accessCode === "string" ? resolvedSearchParams.accessCode : "";
  const accessCodeMessage = accessCodeMessages[accessCodeResult];
  const generatedCode =
    typeof resolvedSearchParams.value === "string" ? resolvedSearchParams.value : "";
  const materialResult =
    typeof resolvedSearchParams.material === "string" ? resolvedSearchParams.material : "";
  const materialMessage = materialMessages[materialResult];
  const roleResult =
    typeof resolvedSearchParams.role === "string" ? resolvedSearchParams.role : "";
  const roleMessage = roleMessages[roleResult];
  const courseResult =
    typeof resolvedSearchParams.course === "string" ? resolvedSearchParams.course : "";
  const courseMessage = courseMessages[courseResult];
  const selectedCourseId =
    typeof resolvedSearchParams.editCourse === "string" ? resolvedSearchParams.editCourse : "";
  const selectedCourse =
    courseEditor.find((course) => course.id === selectedCourseId) ?? null;

  return (
    <section className="admin-page">
      <div className="container-main">
        <BackHomeLink />
        <header className="admin-header">
          <div>
            <span className="eyebrow">Administracja platformą</span>
            <h1>Kody dostępu i materiały</h1>
            <p>
              Płatności są pominięte. Administrator tworzy kody, dodaje pliki i
              filmy, a użytkownik po wpisaniu kodu widzi bibliotekę.
            </p>
          </div>
          <Link href="/panel" className="button-secondary">
            Panel użytkownika
          </Link>
        </header>

        <nav className="admin-tabs" aria-label="Sekcje administracyjne">
          <Link href="/panel/admin/kody">Kody dostępu</Link>
          <Link href="/panel/admin/kursy">Kursy</Link>
          <Link href="/panel/admin/materialy">Materiały</Link>
          <Link href="/panel/admin/uzytkownicy">Użytkownicy</Link>
          <Link href="/panel/admin/dostepy">Nadaj dostęp</Link>
          <Link href="/panel/admin/audyt">Audyt</Link>
        </nav>

        <section
          id="kody"
          className="admin-section admin-grant-section"
          hidden={section !== "kody"}
        >
          <div>
            <p className="checkout-plan__name">Dostęp bez płatności</p>
            <h2>Utwórz kod dostępu</h2>
            <p>
              Kod może nadać dostęp do całej platformy albo do wybranego kursu.
              Po utworzeniu pokaże się tylko raz.
            </p>
          </div>
          <form action="/api/admin/access-codes" method="post" className="admin-grant-form">
            <input type="hidden" name="action" value="create" />
            {accessCodeMessage ? (
              <p className={accessCodeResult === "created" || accessCodeResult === "revoked" ? "auth-notice" : "auth-error"}>
                {accessCodeMessage}
              </p>
            ) : null}
            {generatedCode ? (
              <p className="auth-notice">
                Nowy kod: <strong>{generatedCode}</strong>
              </p>
            ) : null}
            <label>
              <span>Opis</span>
              <input name="label" placeholder="np. Klient z konsultacji" maxLength={120} />
            </label>
            <label>
              <span>Zakres dostępu</span>
              <select name="scope" defaultValue="all_access">
                <option value="all_access">Cała platforma</option>
                <option value="course">Konkretny kurs</option>
              </select>
            </label>
            <label>
              <span>Kurs, jeśli wybrano konkretny kurs</span>
              <select name="courseId" defaultValue="">
                <option value="">Bez konkretnego kursu</option>
                {dashboard.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.status})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Liczba użyć</span>
              <input name="maxUses" type="number" min={1} max={500} defaultValue={1} required />
            </label>
            <label>
              <span>Ważny do</span>
              <input name="expiresAt" type="date" />
            </label>
            <button type="submit" className="button-primary">
              Wygeneruj kod
            </button>
          </form>
        </section>

        <section className="admin-section" hidden={section !== "kody"}>
          <div className="admin-section__heading">
            <div>
              <p className="checkout-plan__name">Ostatnie 100</p>
              <h2>Aktywne i historyczne kody</h2>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Opis</th>
                  <th>Dostęp</th>
                  <th>Użycia</th>
                  <th>Ważny do</th>
                  <th>Status</th>
                  <th>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {accessCodes.map((code) => (
                  <tr key={code.id}>
                    <td>{code.label || "Bez opisu"}</td>
                    <td>{formatAccessScope(code)}</td>
                    <td>{code.used_count} / {code.max_uses}</td>
                    <td>{formatDate(code.expires_at)}</td>
                    <td>{code.revoked_at ? "wyłączony" : "aktywny"}</td>
                    <td>
                      {!code.revoked_at ? (
                        <form action="/api/admin/access-codes" method="post">
                          <input type="hidden" name="action" value="revoke" />
                          <input type="hidden" name="codeId" value={code.id} />
                          <button type="submit" className="button-secondary">
                            Wyłącz
                          </button>
                        </form>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {accessCodes.length === 0 ? (
              <p className="admin-empty-row">Brak kodów.</p>
            ) : null}
          </div>
        </section>

        <section
          id="kursy-admin"
          className="admin-section"
          hidden={section !== "kursy"}
        >
          <div className="admin-section__heading">
            <div>
              <p className="checkout-plan__name">Zawartość kursów</p>
              <h2>Kursy, moduły i lekcje</h2>
            </div>
            <span>{courseEditor.length} kursów</span>
          </div>
          {courseMessage ? (
            <p
              className={
                courseResult === "invalid" ||
                courseResult === "server" ||
                courseResult.endsWith("_not_found") ||
                courseResult === "rate"
                  ? "auth-error"
                  : "auth-notice"
              }
            >
              {courseMessage}
            </p>
          ) : null}

          <form
            action="/api/admin/courses"
            method="post"
            className="admin-grant-form admin-course-create"
          >
            <input type="hidden" name="action" value="create-course" />
            <label>
              <span>Nazwa kursu</span>
              <input name="title" required maxLength={160} />
            </label>
            <label>
              <span>Opis kursu</span>
              <textarea name="description" rows={4} maxLength={800} />
            </label>
            <label>
              <span>Poziom</span>
              <input name="levelLabel" placeholder="np. Start" maxLength={80} />
            </label>
            <label>
              <span>Czas / liczba modułów</span>
              <input name="durationLabel" placeholder="np. 4 moduły" maxLength={80} />
            </label>
            <label>
              <span>Status</span>
              <select name="status" defaultValue="draft">
                <option value="draft">Szkic</option>
                <option value="published">Opublikowany</option>
              </select>
            </label>
            <button type="submit" className="button-primary">
              Dodaj kurs
            </button>
          </form>

          <div className="admin-course-picker">
            <div className="admin-section__heading">
              <div>
                <p className="checkout-plan__name">Wybór edycji</p>
                <h3>Wybierz kurs do edytowania</h3>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kurs</th>
                    <th>Status</th>
                    <th>Moduły</th>
                    <th>Akcja</th>
                  </tr>
                </thead>
                <tbody>
                  {courseEditor.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <strong>{course.title}</strong>
                        <small>{course.description || "Bez opisu"}</small>
                      </td>
                      <td>{course.status}</td>
                      <td>{course.modules.length}</td>
                      <td>
                        <Link
                          href={`/panel/admin/kursy?editCourse=${course.id}`}
                          className="button-secondary"
                        >
                          Edytuj
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {courseEditor.length === 0 ? (
                <p className="admin-empty-row">Brak kursów.</p>
              ) : null}
            </div>
          </div>

          <div className="admin-course-editor">
            {!selectedCourse ? (
              <p className="admin-empty-row">
                Wybierz kurs z listy powyżej, żeby edytować jego moduły, lekcje
                i filmy.
              </p>
            ) : null}
            {(selectedCourse ? [selectedCourse] : []).map((course) => (
              <article key={course.id} className="admin-course-block">
                <div className="admin-course-block__heading">
                  <div>
                    <span className={`status-badge status-badge--${course.status}`}>
                      {course.status}
                    </span>
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                  </div>
                  <form action="/api/admin/courses" method="post">
                    <input type="hidden" name="action" value="archive-course" />
                    <input type="hidden" name="courseId" value={course.id} />
                    <button type="submit" className="button-secondary">
                      Usuń kurs
                    </button>
                  </form>
                </div>

                <form action="/api/admin/courses" method="post" className="admin-inline-form">
                  <input type="hidden" name="action" value="update-course" />
                  <input type="hidden" name="editCourse" value={course.id} />
                  <input type="hidden" name="courseId" value={course.id} />
                  <label>
                    <span>Nazwa</span>
                    <input name="title" required maxLength={160} defaultValue={course.title} />
                  </label>
                  <label>
                    <span>Opis</span>
                    <textarea name="description" rows={3} maxLength={800} defaultValue={course.description} />
                  </label>
                  <label>
                    <span>Poziom</span>
                    <input name="levelLabel" maxLength={80} defaultValue={course.levelLabel} />
                  </label>
                  <label>
                    <span>Czas</span>
                    <input name="durationLabel" maxLength={80} defaultValue={course.durationLabel} />
                  </label>
                  <label>
                    <span>Status</span>
                    <select name="status" defaultValue={course.status === "draft" ? "draft" : "published"}>
                      <option value="draft">Szkic</option>
                      <option value="published">Opublikowany</option>
                    </select>
                  </label>
                  <button type="submit" className="button-primary">
                    Zapisz kurs
                  </button>
                </form>

                <form action="/api/admin/courses" method="post" className="admin-inline-form">
                  <input type="hidden" name="action" value="create-module" />
                  <input type="hidden" name="editCourse" value={course.id} />
                  <input type="hidden" name="courseId" value={course.id} />
                  <label>
                    <span>Nazwa modułu</span>
                    <input name="title" required maxLength={160} />
                  </label>
                  <label>
                    <span>Opis modułu</span>
                    <input name="description" maxLength={500} />
                  </label>
                  <button type="submit" className="button-secondary">
                    Dodaj moduł
                  </button>
                </form>

                <div className="admin-module-list">
                  {course.modules.map((courseModule) => (
                    <section key={courseModule.id} className="admin-module-block">
                      <div className="admin-module-block__heading">
                        <div>
                          <span>Moduł {courseModule.position}</span>
                          <h4>{courseModule.title}</h4>
                          {courseModule.description ? <p>{courseModule.description}</p> : null}
                        </div>
                        <form action="/api/admin/courses" method="post">
                          <input type="hidden" name="action" value="delete-module" />
                          <input type="hidden" name="editCourse" value={course.id} />
                          <input type="hidden" name="moduleId" value={courseModule.id} />
                          <button type="submit" className="button-secondary">
                            Usuń moduł
                          </button>
                        </form>
                      </div>

                      <form action="/api/admin/courses" method="post" className="admin-inline-form">
                        <input type="hidden" name="action" value="update-module" />
                        <input type="hidden" name="editCourse" value={course.id} />
                        <input type="hidden" name="moduleId" value={courseModule.id} />
                        <label>
                          <span>Nazwa modułu</span>
                          <input name="title" required maxLength={160} defaultValue={courseModule.title} />
                        </label>
                        <label>
                          <span>Opis modułu</span>
                          <input name="description" maxLength={500} defaultValue={courseModule.description} />
                        </label>
                        <button type="submit" className="button-secondary">
                          Zapisz moduł
                        </button>
                      </form>

                      <form
                        action="/api/admin/courses"
                        method="post"
                        encType="multipart/form-data"
                        className="admin-inline-form"
                      >
                        <input type="hidden" name="action" value="create-lesson" />
                        <input type="hidden" name="editCourse" value={course.id} />
                        <input type="hidden" name="moduleId" value={courseModule.id} />
                        <label>
                          <span>Tytuł lekcji</span>
                          <input name="title" required maxLength={160} />
                        </label>
                        <label>
                          <span>Krótki opis</span>
                          <input name="summary" maxLength={400} />
                        </label>
                        <label>
                          <span>Treść instrukcji</span>
                          <textarea name="contentMarkdown" rows={5} />
                        </label>
                        <label>
                          <span>Film lekcji</span>
                          <input name="video" type="file" accept=".mp4,.webm,video/mp4,video/webm" />
                        </label>
                        <label>
                          <span>Status</span>
                          <select name="status" defaultValue="draft">
                            <option value="draft">Szkic</option>
                            <option value="published">Opublikowana</option>
                          </select>
                        </label>
                        <button type="submit" className="button-primary">
                          Dodaj lekcję
                        </button>
                      </form>

                      <div className="admin-lesson-list">
                        {courseModule.lessons.map((lesson) => (
                          <form
                            key={lesson.id}
                            action="/api/admin/courses"
                            method="post"
                            encType="multipart/form-data"
                            className="admin-lesson-editor"
                          >
                            <input type="hidden" name="action" value="update-lesson" />
                            <input type="hidden" name="editCourse" value={course.id} />
                            <input type="hidden" name="lessonId" value={lesson.id} />
                            <div className="admin-lesson-editor__heading">
                              <strong>{lesson.position}. {lesson.title}</strong>
                              <span>{lesson.hasVideo ? "film dodany" : "bez filmu"}</span>
                            </div>
                            <label>
                              <span>Tytuł</span>
                              <input name="title" required maxLength={160} defaultValue={lesson.title} />
                            </label>
                            <label>
                              <span>Krótki opis</span>
                              <input name="summary" maxLength={400} defaultValue={lesson.summary} />
                            </label>
                            <label>
                              <span>Treść instrukcji</span>
                              <textarea name="contentMarkdown" rows={5} defaultValue={lesson.contentMarkdown} />
                            </label>
                            <label>
                              <span>Podmień film</span>
                              <input name="video" type="file" accept=".mp4,.webm,video/mp4,video/webm" />
                            </label>
                            <label>
                              <span>Status</span>
                              <select name="status" defaultValue={lesson.status}>
                                <option value="draft">Szkic</option>
                                <option value="published">Opublikowana</option>
                              </select>
                            </label>
                            <div className="admin-form-actions">
                              <button type="submit" className="button-primary">
                                Zapisz lekcję
                              </button>
                              <button
                                type="submit"
                                name="action"
                                value="delete-lesson"
                                className="button-secondary"
                              >
                                Usuń lekcję
                              </button>
                            </div>
                          </form>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="materialy"
          className="admin-section admin-grant-section"
          hidden={section !== "materialy"}
        >
          <div>
            <p className="checkout-plan__name">Biblioteka użytkownika</p>
            <h2>Dodaj film, instrukcję albo notatkę</h2>
            <p>
              Pliki są zapisywane na serwerze. Dozwolone: MP4, WebM, PDF, DOCX,
              JPG i PNG.
            </p>
          </div>
          <form
            action="/api/admin/library-items"
            method="post"
            encType="multipart/form-data"
            className="admin-grant-form"
          >
            {materialMessage ? (
              <p className={materialResult === "created" || materialResult === "updated" || materialResult === "archived" ? "auth-notice" : "auth-error"}>
                {materialMessage}
              </p>
            ) : null}
            <label>
              <span>Tytuł</span>
              <input name="title" required maxLength={160} />
            </label>
            <label>
              <span>Krótki opis</span>
              <textarea name="summary" rows={3} maxLength={400} />
            </label>
            <label>
              <span>Treść instrukcji</span>
              <textarea name="contentMarkdown" rows={7} placeholder="Możesz wkleić zalecenia, plan ćwiczeń albo opis materiału." />
            </label>
            <label>
              <span>Plik lub film</span>
              <input name="file" type="file" accept=".mp4,.webm,.pdf,.docx,.jpg,.jpeg,.png,video/mp4,video/webm,application/pdf" />
            </label>
            <label>
              <span>Status</span>
              <select name="status" defaultValue="published">
                <option value="published">Opublikowany</option>
                <option value="draft">Szkic</option>
              </select>
            </label>
            <button type="submit" className="button-primary">
              Dodaj materiał
            </button>
          </form>
        </section>

        <section className="admin-section" hidden={section !== "materialy"}>
          <div className="admin-section__heading">
            <div>
              <p className="checkout-plan__name">Biblioteka</p>
              <h2>Materiały na stronie</h2>
            </div>
            <span>{libraryItems.length} rekordów</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tytuł</th>
                  <th>Typ</th>
                  <th>Plik</th>
                  <th>Status</th>
                  <th>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {libraryItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <small>{item.summary}</small>
                    </td>
                    <td>{item.itemType}</td>
                    <td>{item.fileName ?? formatFileSize(item.fileSizeBytes)}</td>
                    <td>{item.status}</td>
                    <td>
                      <form action="/api/admin/library-items" method="post">
                        <input type="hidden" name="action" value="archive" />
                        <input type="hidden" name="itemId" value={item.id} />
                        <button type="submit" className="button-secondary">
                          Usuń
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {libraryItems.length === 0 ? (
              <p className="admin-empty-row">Brak materiałów.</p>
            ) : null}
          </div>
        </section>

        <section className="admin-section" hidden={section !== "materialy"}>
          <div className="admin-section__heading">
            <div>
              <p className="checkout-plan__name">Edycja</p>
              <h2>Edytuj istniejący materiał</h2>
            </div>
          </div>
          <div className="panel-courses">
            {libraryItems.map((item) => (
              <form
                key={item.id}
                action="/api/admin/library-items"
                method="post"
                encType="multipart/form-data"
                className="panel-course-card"
              >
                <input type="hidden" name="action" value="update" />
                <input type="hidden" name="itemId" value={item.id} />
                <label>
                  <span>Tytuł</span>
                  <input name="title" required maxLength={160} defaultValue={item.title} />
                </label>
                <label>
                  <span>Krótki opis</span>
                  <textarea name="summary" rows={3} maxLength={400} defaultValue={item.summary} />
                </label>
                <label>
                  <span>Treść instrukcji</span>
                  <textarea name="contentMarkdown" rows={6} defaultValue={item.contentMarkdown} />
                </label>
                <label>
                  <span>Podmień plik</span>
                  <input name="file" type="file" accept=".mp4,.webm,.pdf,.docx,.jpg,.jpeg,.png,video/mp4,video/webm,application/pdf" />
                </label>
                <label>
                  <span>Status</span>
                  <select name="status" defaultValue={item.status === "draft" ? "draft" : "published"}>
                    <option value="published">Opublikowany</option>
                    <option value="draft">Szkic</option>
                  </select>
                </label>
                <button type="submit" className="button-primary">
                  Zapisz zmiany
                </button>
              </form>
            ))}
          </div>
          {libraryItems.length === 0 ? (
            <p className="admin-empty-row">Brak materiałów do edycji.</p>
          ) : null}
        </section>

        <section
          id="dostepy"
          className="admin-section admin-grant-section"
          hidden={section !== "dostepy"}
        >
          <div>
            <p className="checkout-plan__name">Operacja administracyjna</p>
            <h2>Nadaj dostęp użytkownikowi</h2>
            <p>
              Wybierz, czy użytkownik ma dostać całą platformę, czy tylko
              konkretny kurs.
            </p>
          </div>
          <form action="/api/admin/access-grants" method="post" className="admin-grant-form">
            {grantMessage ? (
              <p className={grantResult === "success" ? "auth-notice" : "auth-error"}>
                {grantMessage}
              </p>
            ) : null}
            <label>
              <span>Użytkownik</span>
              <select name="email" required defaultValue="">
                <option value="" disabled>
                  Wybierz konto
                </option>
                {dashboard.users
                  .filter((user) => user.role !== "admin")
                  .map((user) => (
                    <option key={user.id} value={user.email}>
                      {user.email}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>Zakres dostępu</span>
              <select name="scope" defaultValue="all_access">
                <option value="all_access">Cała platforma</option>
                <option value="course">Konkretny kurs</option>
              </select>
            </label>
            <label>
              <span>Kurs, jeśli wybrano konkretny kurs</span>
              <select name="courseId" defaultValue="">
                <option value="">Bez konkretnego kursu</option>
                {dashboard.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.status})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="button-primary">
              Nadaj dostęp
            </button>
          </form>
        </section>

        <section
          id="uzytkownicy"
          className="admin-section"
          hidden={section !== "uzytkownicy"}
        >
          <div className="admin-section__heading">
            <div>
              <p className="checkout-plan__name">Role i uprawnienia</p>
              <h2>Użytkownicy platformy</h2>
            </div>
            <span>
              {dashboard.adminCount} admin / {dashboard.userCount} użytkowników
            </span>
          </div>
          {roleMessage ? (
            <p
              className={
                roleResult === "granted" || roleResult === "revoked"
                  ? "auth-notice"
                  : "auth-error"
              }
            >
              {roleMessage}
            </p>
          ) : null}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Rola</th>
                  <th>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>
                      <span className={`status-badge status-badge--${user.role}`}>
                        {user.role === "admin" ? "admin" : "użytkownik"}
                      </span>
                    </td>
                    <td>
                      <form action="/api/admin/users/role" method="post">
                        <input
                          type="hidden"
                          name="action"
                          value={
                            user.role === "admin"
                              ? "revoke-admin"
                              : "grant-admin"
                          }
                        />
                        <input type="hidden" name="userId" value={user.id} />
                        <button type="submit" className="button-secondary">
                          {user.role === "admin"
                            ? "Odbierz admina"
                            : "Nadaj admina"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dashboard.users.length === 0 ? (
              <p className="admin-empty-row">Brak aktywnych użytkowników.</p>
            ) : null}
          </div>
        </section>

        <section id="audyt" className="admin-section" hidden={section !== "audyt"}>
          <div className="admin-section__heading">
            <div>
              <p className="checkout-plan__name">Dziennik zmian</p>
              <h2>Operacje administratorów</h2>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Operacja</th>
                  <th>Użytkownik</th>
                  <th>Kurs</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.auditEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{event.admin_email}</td>
                    <td>{event.action}</td>
                    <td>{event.target_email ?? "—"}</td>
                    <td>{event.course_title ?? "—"}</td>
                    <td>{formatDate(event.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dashboard.auditEvents.length === 0 ? (
              <p className="admin-empty-row">Brak operacji administracyjnych.</p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default AdminPanelPage;
