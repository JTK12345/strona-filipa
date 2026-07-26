import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDashboard } from "@/app/lib/admin";
import { getCurrentAccessSession } from "@/app/lib/access";
import { BackHomeLink } from "@/components/BackHomeLink";
import { isP24Enabled } from "@/app/lib/payments/przelewy24-config";

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

const p24Messages: Record<string, string> = {
  success: "Przelewy24 potwierdziło poprawny dostęp do API.",
  disabled: "Integracja P24 jest wyłączona przez P24_ENABLED=false.",
  config: "Konfiguracja P24 jest niepełna lub nieprawidłowa.",
  failed: "P24 nie potwierdziło dostępu. Sprawdź dane i dozwolony adres IP.",
  rate: "Wykonano zbyt wiele testów. Odczekaj kilka minut.",
};

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(value)
    : "—";
}

function formatAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency.trim(),
  }).format(amountCents / 100);
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

  const dashboard = await getAdminDashboard();
  const grantResult =
    typeof searchParams.grant === "string" ? searchParams.grant : "";
  const grantMessage = grantMessages[grantResult];
  const p24Result =
    typeof searchParams.p24 === "string" ? searchParams.p24 : "";
  const p24Message = p24Messages[p24Result];
  const paymentsEnabled = isP24Enabled();
  const paymentEnvironment =
    process.env.P24_ENV === "production" ? "production" : "sandbox";

  return (
    <section className="admin-page">
      <div className="container-main">
        <BackHomeLink />
        <header className="admin-header">
          <div>
            <span className="eyebrow">Administracja platformą</span>
            <h1>Zamówienia, zdarzenia i dostępy</h1>
            <p>
              Panel pokazuje stan zapisany w bazie. Płatność może zostać
              potwierdzona wyłącznie przez zweryfikowaną notyfikację Przelewy24.
            </p>
          </div>
          <Link href="/panel" className="button-secondary">
            Panel użytkownika
          </Link>
        </header>

        <nav className="admin-tabs" aria-label="Sekcje administracyjne">
          <a href="#zamowienia">Zamówienia</a>
          <a href="#zdarzenia">Zdarzenia płatnicze</a>
          <a href="#dostepy">Nadaj dostęp</a>
          <a href="#p24">Przelewy24</a>
          <a href="#audyt">Audyt</a>
        </nav>

        <section id="zamowienia" className="admin-section">
          <div className="admin-section__heading">
            <div>
              <p className="checkout-plan__name">Ostatnie 100</p>
              <h2>Zamówienia</h2>
            </div>
            <span>{dashboard.purchases.length} rekordów</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Zamówienie</th>
                  <th>Użytkownik</th>
                  <th>Kurs</th>
                  <th>Kwota</th>
                  <th>Status</th>
                  <th>Utworzono</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.purchases.map((purchase) => (
                  <tr key={purchase.public_order_number}>
                    <td>
                      <strong>{purchase.public_order_number}</strong>
                      <small>{purchase.provider}</small>
                    </td>
                    <td>{purchase.buyer_email}</td>
                    <td>{purchase.course_title}</td>
                    <td>
                      {formatAmount(
                        purchase.amount_cents,
                        purchase.currency,
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${purchase.status}`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td>{formatDate(purchase.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dashboard.purchases.length === 0 ? (
              <p className="admin-empty-row">Brak zamówień.</p>
            ) : null}
          </div>
        </section>

        <section id="zdarzenia" className="admin-section">
          <div className="admin-section__heading">
            <div>
              <p className="checkout-plan__name">Diagnostyka</p>
              <h2>Zdarzenia płatnicze</h2>
            </div>
            <span>{dashboard.events.length} rekordów</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Odebrano</th>
                  <th>Przetworzono</th>
                  <th>Wynik</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.event_type}</td>
                    <td>{formatDate(event.created_at)}</td>
                    <td>{formatDate(event.processed_at)}</td>
                    <td>{event.error_message ?? "OK"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dashboard.events.length === 0 ? (
              <p className="admin-empty-row">Brak zdarzeń płatniczych.</p>
            ) : null}
          </div>
        </section>

        <section id="dostepy" className="admin-section admin-grant-section">
          <div>
            <p className="checkout-plan__name">Operacja administracyjna</p>
            <h2>Nadaj dostęp do kursu</h2>
            <p>
              Ta operacja nie zmienia statusu płatności. Tworzy osobny dostęp
              administracyjny i wpis w dzienniku audytowym.
            </p>
          </div>
          <form action="/api/admin/access-grants" method="post" className="admin-grant-form">
            {grantMessage ? (
              <p
                className={grantResult === "success" ? "auth-notice" : "auth-error"}
              >
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

        <section id="p24" className="admin-section admin-p24-section">
          <div>
            <p className="checkout-plan__name">Połączenie operatora</p>
            <h2>Test dostępu Przelewy24</h2>
            <p>
              Tryb: <strong>{paymentEnvironment}</strong>. Integracja:{" "}
              <strong>{paymentsEnabled ? "włączona" : "wyłączona"}</strong>.
              Test nie tworzy płatności i nie zmienia zamówień.
            </p>
          </div>
          <form
            action="/api/admin/payments/przelewy24/test-access"
            method="post"
            className="admin-p24-action"
          >
            {p24Message ? (
              <p
                className={p24Result === "success" ? "auth-notice" : "auth-error"}
              >
                {p24Message}
              </p>
            ) : null}
            <button
              type="submit"
              className="button-primary"
              disabled={!paymentsEnabled}
            >
              Sprawdź dostęp API
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
