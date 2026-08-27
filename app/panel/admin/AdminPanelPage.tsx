import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDashboard } from "@/app/lib/admin";
import { listAccessCodes } from "@/app/lib/access-codes";
import { getAdminCourseEditor } from "@/app/lib/admin-course-editor";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getAdminLibraryItems } from "@/app/lib/library";
import { listContactSubmissions } from "@/app/lib/contact-submissions";
import {
  ConfirmSubmitButton,
  CopyGeneratedCode,
} from "@/components/admin/AdminActionControls";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Administracja | Świadomy Profil Ciała",
  robots: { index: false, follow: false },
};

const grantMessages: Record<string, string> = {
  success: "Dostęp został nadany i zapisany w dzienniku audytowym.",
  revoked: "Dostęp został cofnięty.",
  invalid: "Sprawdź adres e-mail i wybrany zakres dostępu.",
  user_not_found: "Nie znaleziono aktywnego użytkownika z tym adresem e-mail.",
  course_not_found: "Wybrany kurs nie istnieje lub jest zarchiwizowany.",
  already_granted: "Ten użytkownik ma już taki dostęp.",
  grant_not_found: "Nie znaleziono aktywnego dostępu do cofnięcia.",
  server: "Nie udało się nadać dostępu. Spróbuj ponownie.",
  rate: "Wykonano zbyt wiele operacji. Odczekaj kilka minut.",
};

const submissionMessages: Record<string, string> = {
  updated: "Zgłoszenie zostało zaktualizowane.",
  invalid: "Nie udało się odczytać zgłoszenia.",
  server: "Nie udało się zapisać zmiany zgłoszenia.",
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
  deleted: "Konto użytkownika zostało usunięte.",
  invalid: "Nieprawidłowa operacja użytkownika.",
  user_not_found: "Nie znaleziono aktywnego użytkownika.",
  already_admin: "Ten użytkownik jest już administratorem.",
  already_user: "Ten użytkownik nie ma uprawnień administratora.",
  last_admin: "Nie można odebrać uprawnień ostatniemu administratorowi.",
  self_delete: "Nie możesz usunąć własnego konta administratora.",
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

function searchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  return typeof searchParams[key] === "string" ? searchParams[key].trim() : "";
}

function includesNormalized(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function formatMaterialType(type: "video" | "note" | "file") {
  if (type === "video") {
    return "Film";
  }

  if (type === "file") {
    return "Plik";
  }

  return "Instrukcja";
}

function formatMaterialVisibility(item: {
  visibility: "all_access" | "selected_users";
  grantedUserEmails: string[];
}) {
  if (item.visibility === "all_access") {
    return "Wszyscy z dostępem";
  }

  if (item.grantedUserEmails.length === 0) {
    return "Wybrane osoby";
  }

  return item.grantedUserEmails.length <= 2
    ? item.grantedUserEmails.join(", ")
    : `${item.grantedUserEmails.slice(0, 2).join(", ")} +${item.grantedUserEmails.length - 2}`;
}

export type AdminSection =
  | "kody"
  | "kursy"
  | "materialy"
  | "uzytkownicy"
  | "dostepy"
  | "audyt"
  | "zgloszenia";

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

  const [dashboard, accessCodes, libraryItems, courseEditor, submissions] = await Promise.all([
    getAdminDashboard(),
    listAccessCodes(),
    getAdminLibraryItems(),
    getAdminCourseEditor(),
    listContactSubmissions(),
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
  const submissionResult =
    typeof resolvedSearchParams.submission === "string" ? resolvedSearchParams.submission : "";
  const submissionMessage = submissionMessages[submissionResult];
  const selectedCourseId =
    typeof resolvedSearchParams.editCourse === "string" ? resolvedSearchParams.editCourse : "";
  const selectedCourse =
    courseEditor.find((course) => course.id === selectedCourseId) ?? null;
  const selectedMaterialId =
    typeof resolvedSearchParams.editMaterial === "string"
      ? resolvedSearchParams.editMaterial
      : "";
  const selectedMaterial =
    libraryItems.find((item) => item.id === selectedMaterialId) ?? null;
  const materialUsers = dashboard.users.filter((user) => user.role === "user");
  const codeSearch = searchParam(resolvedSearchParams, "codeSearch");
  const codeStatus = searchParam(resolvedSearchParams, "codeStatus");
  const codeScope = searchParam(resolvedSearchParams, "codeScope");
  const materialSearch = searchParam(resolvedSearchParams, "materialSearch");
  const materialStatus = searchParam(resolvedSearchParams, "materialStatus");
  const materialType = searchParam(resolvedSearchParams, "materialType");
  const userSearch = searchParam(resolvedSearchParams, "userSearch");
  const userRole = searchParam(resolvedSearchParams, "userRole");
  const grantSearch = searchParam(resolvedSearchParams, "grantSearch");
  const grantScope = searchParam(resolvedSearchParams, "grantScope");
  const submissionSearch = searchParam(resolvedSearchParams, "submissionSearch");
  const submissionStatus = searchParam(resolvedSearchParams, "submissionStatus");
  const filteredAccessCodes = accessCodes.filter((code) => {
    const status = code.revoked_at ? "revoked" : "active";
    const matchesSearch =
      !codeSearch ||
      includesNormalized(`${code.label} ${formatAccessScope(code)}`, codeSearch);
    const matchesStatus = !codeStatus || codeStatus === status;
    const matchesScope = !codeScope || codeScope === code.scope;

    return matchesSearch && matchesStatus && matchesScope;
  });
  const filteredLibraryItems = libraryItems.filter((item) => {
    const matchesSearch =
      !materialSearch ||
      includesNormalized(
        `${item.title} ${item.summary} ${item.contentMarkdown}`,
        materialSearch,
      );
    const matchesStatus = !materialStatus || item.status === materialStatus;
    const matchesType = !materialType || item.itemType === materialType;

    return matchesSearch && matchesStatus && matchesType;
  });
  const filteredUsers = dashboard.users.filter((user) => {
    const matchesSearch = !userSearch || includesNormalized(user.email, userSearch);
    const matchesRole = !userRole || user.role === userRole;

    return matchesSearch && matchesRole;
  });
  const filteredGrants = dashboard.accessGrants.filter((grant) => {
    const matchesSearch =
      !grantSearch ||
      includesNormalized(
        `${grant.user_email} ${grant.course_title ?? ""} ${grant.source}`,
        grantSearch,
      );
    const matchesScope = !grantScope || grant.scope === grantScope;

    return matchesSearch && matchesScope;
  });
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      !submissionSearch ||
      includesNormalized(
        `${submission.name} ${submission.email} ${submission.phone} ${submission.topic} ${submission.message}`,
        submissionSearch,
      );
    const matchesStatus = !submissionStatus || submission.status === submissionStatus;

    return matchesSearch && matchesStatus;
  });

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
          <Link href="/panel/admin/zgloszenia">Zgłoszenia</Link>
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
            <p className="meta-label">Dostęp bez płatności</p>
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
              <div className="admin-generated-code auth-notice">
                <span>
                  Nowy kod: <strong>{generatedCode}</strong>
                </span>
                <CopyGeneratedCode value={generatedCode} />
              </div>
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
              <p className="meta-label">Ostatnie 100</p>
              <h2>Aktywne i historyczne kody</h2>
            </div>
            <span>{filteredAccessCodes.length} / {accessCodes.length}</span>
          </div>
          <form className="admin-filter-bar" action="/panel/admin/kody">
            <label>
              <span>Szukaj</span>
              <input name="codeSearch" defaultValue={codeSearch} placeholder="Opis albo zakres" />
            </label>
            <label>
              <span>Status</span>
              <select name="codeStatus" defaultValue={codeStatus}>
                <option value="">Wszystkie</option>
                <option value="active">Aktywne</option>
                <option value="revoked">Wyłączone</option>
              </select>
            </label>
            <label>
              <span>Dostęp</span>
              <select name="codeScope" defaultValue={codeScope}>
                <option value="">Wszystkie</option>
                <option value="all_access">Cała platforma</option>
                <option value="library">Biblioteka</option>
                <option value="course">Kurs</option>
              </select>
            </label>
            <div className="admin-filter-bar__actions">
              <button type="submit" className="button-primary">Filtruj</button>
              <Link href="/panel/admin/kody" className="button-secondary">Wyczyść</Link>
            </div>
          </form>
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
                {filteredAccessCodes.map((code) => (
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
                          <ConfirmSubmitButton
                            className="button-secondary"
                            confirmMessage="Wyłączyć ten kod dostępu?"
                          >
                            Wyłącz
                          </ConfirmSubmitButton>
                        </form>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAccessCodes.length === 0 ? (
              <p className="admin-empty-row">
                {accessCodes.length === 0 ? "Brak kodów." : "Brak kodów dla wybranych filtrów."}
              </p>
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
              <p className="meta-label">Zawartość kursów</p>
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
                <p className="meta-label">Wybór edycji</p>
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
                    <ConfirmSubmitButton
                      className="button-secondary"
                      confirmMessage={`Usunąć kurs "${course.title}" ze strony?`}
                    >
                      Usuń kurs
                    </ConfirmSubmitButton>
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
                          <ConfirmSubmitButton
                            className="button-secondary"
                            confirmMessage={`Usunąć moduł "${courseModule.title}" razem z lekcjami?`}
                          >
                            Usuń moduł
                          </ConfirmSubmitButton>
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
                          <span>Plik do pobrania</span>
                          <input name="attachment" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf" />
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
                              <span>
                                {lesson.hasVideo ? "film dodany" : "bez filmu"} ·{" "}
                                {lesson.hasAttachment
                                  ? lesson.attachmentFileName ?? "plik dodany"
                                  : "bez pliku"}
                              </span>
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
                              <span>Podmień plik do pobrania</span>
                              <input name="attachment" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf" />
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
                              <ConfirmSubmitButton
                                name="action"
                                value="delete-lesson"
                                className="button-secondary"
                                confirmMessage={`Usunąć lekcję "${lesson.title}"?`}
                              >
                                Usuń lekcję
                              </ConfirmSubmitButton>
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
            <p className="meta-label">Biblioteka użytkownika</p>
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
              <span>Film</span>
              <input name="video" type="file" accept=".mp4,.webm,video/mp4,video/webm" />
            </label>
            <label>
              <span>Plik do pobrania</span>
              <input name="attachment" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf" />
            </label>
            <label>
              <span>Status</span>
              <select name="status" defaultValue="published">
                <option value="published">Opublikowany</option>
                <option value="draft">Szkic</option>
              </select>
            </label>
            <fieldset className="admin-choice-group">
              <legend>Widoczność</legend>
              <label>
                <input
                  name="visibility"
                  type="radio"
                  value="all_access"
                  defaultChecked
                />
                <span>Wszyscy z dostępem do biblioteki</span>
              </label>
              <label>
                <input name="visibility" type="radio" value="selected_users" />
                <span>Tylko wybrani użytkownicy</span>
              </label>
            </fieldset>
            <fieldset className="admin-user-picker">
              <legend>Wybrane osoby</legend>
              {materialUsers.length > 0 ? (
                materialUsers.map((user) => (
                  <label key={user.id}>
                    <input
                      name="grantedUserIds"
                      type="checkbox"
                      value={user.id}
                    />
                    <span>{user.email}</span>
                  </label>
                ))
              ) : (
                <p>Brak kont użytkowników do wyboru.</p>
              )}
            </fieldset>
            <button type="submit" className="button-primary">
              Dodaj materiał
            </button>
          </form>
        </section>

        <section className="admin-section" hidden={section !== "materialy"}>
          <div className="admin-section__heading">
            <div>
              <p className="meta-label">Biblioteka</p>
              <h2>Materiały na stronie</h2>
            </div>
            <span>{filteredLibraryItems.length} / {libraryItems.length} rekordów</span>
          </div>
          <form className="admin-filter-bar" action="/panel/admin/materialy">
            <label>
              <span>Szukaj</span>
              <input
                name="materialSearch"
                defaultValue={materialSearch}
                placeholder="Tytuł, opis albo treść"
              />
            </label>
            <label>
              <span>Status</span>
              <select name="materialStatus" defaultValue={materialStatus}>
                <option value="">Wszystkie</option>
                <option value="published">Opublikowane</option>
                <option value="draft">Szkice</option>
              </select>
            </label>
            <label>
              <span>Typ</span>
              <select name="materialType" defaultValue={materialType}>
                <option value="">Wszystkie</option>
                <option value="video">Filmy</option>
                <option value="file">Pliki</option>
                <option value="note">Instrukcje</option>
              </select>
            </label>
            <div className="admin-filter-bar__actions">
              <button type="submit" className="button-primary">Filtruj</button>
              <Link href="/panel/admin/materialy" className="button-secondary">Wyczyść</Link>
            </div>
          </form>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tytuł</th>
                  <th>Typ</th>
                  <th>Plik</th>
                  <th>Widoczność</th>
                  <th>Status</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredLibraryItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <small>{item.summary}</small>
                    </td>
                    <td>{formatMaterialType(item.itemType)}</td>
                    <td>
                      <span>
                        Film: {item.videoFileName ?? formatFileSize(item.videoFileSizeBytes)}
                      </span>
                      <small>
                        Plik: {item.attachmentFileName ?? formatFileSize(item.attachmentFileSizeBytes)}
                      </small>
                    </td>
                    <td>{formatMaterialVisibility(item)}</td>
                    <td>{item.status}</td>
                    <td>
                      <div className="admin-table-actions">
                        <Link
                          href={`/panel/admin/materialy?editMaterial=${item.id}`}
                          className="button-secondary"
                        >
                          Edytuj
                        </Link>
                        <form action="/api/admin/library-items" method="post">
                          <input type="hidden" name="action" value="archive" />
                          <input type="hidden" name="itemId" value={item.id} />
                          <ConfirmSubmitButton
                            className="button-secondary"
                            confirmMessage={`Usunąć materiał "${item.title}" z biblioteki?`}
                          >
                            Usuń
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLibraryItems.length === 0 ? (
              <p className="admin-empty-row">
                {libraryItems.length === 0 ? "Brak materiałów." : "Brak materiałów dla wybranych filtrów."}
              </p>
            ) : null}
          </div>
        </section>

        <section className="admin-section" hidden={section !== "materialy"}>
          <div className="admin-section__heading">
            <div>
              <p className="meta-label">Edycja</p>
              <h2>Edytuj wybrany materiał</h2>
            </div>
          </div>
          {!selectedMaterial ? (
            <p className="admin-empty-row">
              Wybierz materiał z tabeli powyżej, żeby otworzyć edycję tylko
              jednego wpisu.
            </p>
          ) : null}
          <div className="panel-courses">
            {(selectedMaterial ? [selectedMaterial] : []).map((item) => (
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
                  <span>Podmień film</span>
                  <input name="video" type="file" accept=".mp4,.webm,video/mp4,video/webm" />
                </label>
                <label>
                  <span>Podmień plik do pobrania</span>
                  <input name="attachment" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf" />
                </label>
                <label>
                  <span>Status</span>
                  <select name="status" defaultValue={item.status === "draft" ? "draft" : "published"}>
                    <option value="published">Opublikowany</option>
                    <option value="draft">Szkic</option>
                  </select>
                </label>
                <fieldset className="admin-choice-group">
                  <legend>Widoczność</legend>
                  <label>
                    <input
                      name="visibility"
                      type="radio"
                      value="all_access"
                      defaultChecked={item.visibility === "all_access"}
                    />
                    <span>Wszyscy z dostępem do biblioteki</span>
                  </label>
                  <label>
                    <input
                      name="visibility"
                      type="radio"
                      value="selected_users"
                      defaultChecked={item.visibility === "selected_users"}
                    />
                    <span>Tylko wybrani użytkownicy</span>
                  </label>
                </fieldset>
                <fieldset className="admin-user-picker">
                  <legend>Wybrane osoby</legend>
                  {materialUsers.length > 0 ? (
                    materialUsers.map((user) => (
                      <label key={user.id}>
                        <input
                          name="grantedUserIds"
                          type="checkbox"
                          value={user.id}
                          defaultChecked={item.grantedUserIds.includes(user.id)}
                        />
                        <span>{user.email}</span>
                      </label>
                    ))
                  ) : (
                    <p>Brak kont użytkowników do wyboru.</p>
                  )}
                </fieldset>
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
          id="zgloszenia"
          className="admin-section"
          hidden={section !== "zgloszenia"}
        >
          <div className="admin-section__heading">
            <div>
              <p className="meta-label">Kontakt ze strony</p>
              <h2>Zgłoszenia konsultacji</h2>
            </div>
            <span>{filteredSubmissions.length} / {submissions.length}</span>
          </div>
          {submissionMessage ? (
            <p className={submissionResult === "updated" ? "auth-notice" : "auth-error"}>
              {submissionMessage}
            </p>
          ) : null}
          <form className="admin-filter-bar" action="/panel/admin/zgloszenia">
            <label>
              <span>Szukaj</span>
              <input
                name="submissionSearch"
                type="search"
                defaultValue={submissionSearch}
                placeholder="Imię, e-mail, telefon albo temat"
              />
            </label>
            <label>
              <span>Status</span>
              <select name="submissionStatus" defaultValue={submissionStatus}>
                <option value="">Wszystkie</option>
                <option value="new">Nowe</option>
                <option value="in_progress">W trakcie</option>
                <option value="closed">Zamknięte</option>
              </select>
            </label>
            <div className="admin-filter-bar__actions">
              <button type="submit" className="button-primary">Filtruj</button>
              <Link href="/panel/admin/zgloszenia" className="button-secondary">Wyczyść</Link>
            </div>
          </form>
          <div className="admin-submission-list">
            {filteredSubmissions.map((submission) => (
              <article key={submission.id} className="admin-submission-card">
                <div className="admin-submission-card__header">
                  <div>
                    <p className="meta-label">
                      {submission.status === "new"
                        ? "Nowe"
                        : submission.status === "in_progress"
                          ? "W trakcie"
                          : "Zamknięte"} · {formatDate(submission.createdAt)}
                    </p>
                    <h3>{submission.name}</h3>
                    <p>
                      {submission.email}
                      {submission.phone ? ` · ${submission.phone}` : ""}
                    </p>
                  </div>
                  <a href={`mailto:${submission.email}`} className="button-secondary">
                    Odpowiedz
                  </a>
                </div>
                {submission.topic ? <strong>{submission.topic}</strong> : null}
                <p>{submission.message}</p>
                <form
                  action="/api/admin/contact-submissions"
                  method="post"
                  className="admin-submission-card__form"
                >
                  <input type="hidden" name="submissionId" value={submission.id} />
                  <label>
                    <span>Status</span>
                    <select name="status" defaultValue={submission.status}>
                      <option value="new">Nowe</option>
                      <option value="in_progress">W trakcie</option>
                      <option value="closed">Zamknięte</option>
                    </select>
                  </label>
                  <label>
                    <span>Notatka admina</span>
                    <textarea
                      name="adminNote"
                      rows={3}
                      maxLength={2000}
                      defaultValue={submission.adminNote}
                    />
                  </label>
                  <button type="submit" className="button-primary">
                    Zapisz status
                  </button>
                </form>
              </article>
            ))}
            {filteredSubmissions.length === 0 ? (
              <p className="admin-empty-row">
                {submissions.length === 0
                  ? "Brak zgłoszeń."
                  : "Brak zgłoszeń dla wybranych filtrów."}
              </p>
            ) : null}
          </div>
        </section>

        <section
          id="dostepy"
          className="admin-section admin-grant-section"
          hidden={section !== "dostepy"}
        >
          <div>
            <p className="meta-label">Operacja administracyjna</p>
            <h2>Nadaj dostęp użytkownikowi</h2>
            <p>
              Wybierz, czy użytkownik ma dostać całą platformę, czy tylko
              konkretny kurs.
            </p>
          </div>
          <form action="/api/admin/access-grants" method="post" className="admin-grant-form">
            <input type="hidden" name="action" value="grant" />
            {grantMessage ? (
              <p className={grantResult === "success" || grantResult === "revoked" ? "auth-notice" : "auth-error"}>
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

        <section className="admin-section" hidden={section !== "dostepy"}>
          <div className="admin-section__heading">
            <div>
              <p className="meta-label">Aktywne dostępy</p>
              <h2>Dostępy użytkowników</h2>
            </div>
            <span>{filteredGrants.length} / {dashboard.accessGrants.length}</span>
          </div>
          <form className="admin-filter-bar" action="/panel/admin/dostepy">
            <label>
              <span>Szukaj</span>
              <input
                name="grantSearch"
                type="search"
                defaultValue={grantSearch}
                placeholder="E-mail, kurs albo źródło"
              />
            </label>
            <label>
              <span>Zakres</span>
              <select name="grantScope" defaultValue={grantScope}>
                <option value="">Wszystkie</option>
                <option value="all_access">Cała platforma</option>
                <option value="library">Biblioteka</option>
                <option value="course">Kurs</option>
              </select>
            </label>
            <div className="admin-filter-bar__actions">
              <button type="submit" className="button-primary">Filtruj</button>
              <Link href="/panel/admin/dostepy" className="button-secondary">Wyczyść</Link>
            </div>
          </form>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Użytkownik</th>
                  <th>Dostęp</th>
                  <th>Źródło</th>
                  <th>Ważny do</th>
                  <th>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrants.map((grant) => (
                  <tr key={grant.id}>
                    <td>{grant.user_email}</td>
                    <td>
                      {grant.scope === "course"
                        ? grant.course_title
                          ? `Kurs: ${grant.course_title}`
                          : "Kurs"
                        : grant.scope === "library"
                          ? "Biblioteka"
                          : "Cała platforma"}
                    </td>
                    <td>{grant.source}</td>
                    <td>{formatDate(grant.expires_at)}</td>
                    <td>
                      <form action="/api/admin/access-grants" method="post">
                        <input type="hidden" name="action" value="revoke" />
                        <input type="hidden" name="grantId" value={grant.id} />
                        <ConfirmSubmitButton
                          className="button-secondary button-danger"
                          confirmMessage={`Cofnąć dostęp dla ${grant.user_email}?`}
                        >
                          Cofnij dostęp
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredGrants.length === 0 ? (
              <p className="admin-empty-row">
                {dashboard.accessGrants.length === 0
                  ? "Brak aktywnych dostępów."
                  : "Brak dostępów dla wybranych filtrów."}
              </p>
            ) : null}
          </div>
        </section>

        <section
          id="uzytkownicy"
          className="admin-section"
          hidden={section !== "uzytkownicy"}
        >
          <div className="admin-section__heading">
            <div>
              <p className="meta-label">Role i uprawnienia</p>
              <h2>Użytkownicy platformy</h2>
            </div>
            <span>
              {filteredUsers.length} widocznych · {dashboard.adminCount} admin / {dashboard.userCount} użytkowników
            </span>
          </div>
          {roleMessage ? (
            <p
              className={
                roleResult === "granted" || roleResult === "revoked"
                  || roleResult === "deleted"
                  ? "auth-notice"
                  : "auth-error"
              }
            >
              {roleMessage}
            </p>
          ) : null}
          <form className="admin-filter-bar" action="/panel/admin/uzytkownicy">
            <label>
              <span>Szukaj</span>
              <input name="userSearch" type="search" defaultValue={userSearch} placeholder="Adres e-mail" />
            </label>
            <label>
              <span>Rola</span>
              <select name="userRole" defaultValue={userRole}>
                <option value="">Wszystkie</option>
                <option value="user">Użytkownicy</option>
                <option value="admin">Administratorzy</option>
              </select>
            </label>
            <div className="admin-filter-bar__actions">
              <button type="submit" className="button-primary">Filtruj</button>
              <Link href="/panel/admin/uzytkownicy" className="button-secondary">Wyczyść</Link>
            </div>
          </form>
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
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>
                      <span className={`status-badge status-badge--${user.role}`}>
                        {user.role === "admin" ? "admin" : "użytkownik"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
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
                          <ConfirmSubmitButton
                            className="button-secondary"
                            confirmMessage={
                              user.role === "admin"
                                ? `Odebrać uprawnienia administratora dla ${user.email}?`
                                : `Nadać uprawnienia administratora dla ${user.email}?`
                            }
                          >
                            {user.role === "admin"
                              ? "Odbierz admina"
                              : "Nadaj admina"}
                          </ConfirmSubmitButton>
                        </form>
                        <form action="/api/admin/users/role" method="post">
                          <input type="hidden" name="action" value="delete-user" />
                          <input type="hidden" name="userId" value={user.id} />
                          <ConfirmSubmitButton
                            className="button-secondary button-danger"
                            confirmMessage={`Usunąć konto ${user.email}? Tej operacji nie cofniesz z panelu.`}
                          >
                            Usuń konto
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 ? (
              <p className="admin-empty-row">
                {dashboard.users.length === 0 ? "Brak aktywnych użytkowników." : "Brak użytkowników dla wybranych filtrów."}
              </p>
            ) : null}
          </div>
        </section>

        <section id="audyt" className="admin-section" hidden={section !== "audyt"}>
          <div className="admin-section__heading">
            <div>
              <p className="meta-label">Dziennik zmian</p>
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
