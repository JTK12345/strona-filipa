import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDashboard } from "@/app/lib/admin";
import { listAccessCodes } from "@/app/lib/access-codes";
import { getCurrentAccessSession } from "@/app/lib/access";
import { getAdminLibraryItems } from "@/app/lib/library";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Administracja | Świadomy Profil Ciała",
  robots: { index: false, follow: false },
};

const grantMessages: Record<string, string> = {
  success: "Dostęp do kursu został nadany i zapisany w dzienniku audytowym.",
  invalid: "Sprawdź adres e-mail i wybrany kurs.",
  user_not_found: "Nie znaleziono aktywnego użytkownika z tym adresem e-mail.",
  course_not_found: "Wybrany kurs nie istnieje lub jest zarchiwizowany.",
  already_granted: "Ten użytkownik ma już dostęp do wybranego kursu.",
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

export default async function AdminPage(props: PageProps<"/panel/admin">) {
  const session = await getCurrentAccessSession();
  const searchParams = await props.searchParams;

  if (!session) {
    redirect("/logowanie?next=/panel");
  }

  if (session.role !== "admin") {
    redirect("/panel");
  }

  const [dashboard, accessCodes, libraryItems] = await Promise.all([
    getAdminDashboard(),
    listAccessCodes(),
    getAdminLibraryItems(),
  ]);

  const grantResult =
    typeof searchParams.grant === "string" ? searchParams.grant : "";
  const grantMessage = grantMessages[grantResult];
  const accessCodeResult =
    typeof searchParams.accessCode === "string" ? searchParams.accessCode : "";
  const accessCodeMessage = accessCodeMessages[accessCodeResult];
  const generatedCode =
    typeof searchParams.value === "string" ? searchParams.value : "";
  const materialResult =
    typeof searchParams.material === "string" ? searchParams.material : "";
  const materialMessage = materialMessages[materialResult];

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
          <a href="#kody">Kody dostępu</a>
          <a href="#materialy">Materiały</a>
          <a href="#dostepy">Nadaj kurs ręcznie</a>
          <a href="#audyt">Audyt</a>
        </nav>

        <section id="kody" className="admin-section admin-grant-section">
          <div>
            <p className="checkout-plan__name">Dostęp bez płatności</p>
            <h2>Utwórz kod dostępu</h2>
            <p>
              Kod nadaje pełny dostęp do biblioteki i materiałów. Po utworzeniu
              pokaże się tylko raz.
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

        <section className="admin-section">
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

        <section id="materialy" className="admin-section admin-grant-section">
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
              <p className={materialResult === "created" || materialResult === "archived" ? "auth-notice" : "auth-error"}>
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

        <section className="admin-section">
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

        <section className="admin-section">
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

        <section id="dostepy" className="admin-section admin-grant-section">
          <div>
            <p className="checkout-plan__name">Operacja administracyjna</p>
            <h2>Nadaj dostęp do konkretnego kursu</h2>
            <p>
              Opcjonalne narzędzie do ręcznego przypisania kursu istniejącemu
              użytkownikowi.
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
              <span>Kurs</span>
              <select name="courseId" required defaultValue="">
                <option value="" disabled>
                  Wybierz kurs
                </option>
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

        <section id="audyt" className="admin-section">
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
