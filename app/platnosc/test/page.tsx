import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserPurchaseStatus } from "@/app/lib/payments/purchase-status";
import { isTestPaymentAllowed } from "@/app/lib/payments/test-payment-config";
import { getCurrentUserSession } from "@/app/lib/session";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Symulator płatności | Świadomy Profil Ciała",
  robots: { index: false, follow: false },
};

export default async function TestPaymentPage(
  props: PageProps<"/platnosc/test">,
) {
  const searchParams = await props.searchParams;
  const session = await getCurrentUserSession();

  if (!session) {
    redirect("/logowanie?next=/kup");
  }

  if (!isTestPaymentAllowed(session.email)) {
    notFound();
  }

  const publicOrderNumber =
    typeof searchParams.order === "string" &&
    /^PC-[A-F0-9]{16}$/.test(searchParams.order)
      ? searchParams.order
      : null;

  if (!publicOrderNumber) {
    notFound();
  }

  const purchase = await getUserPurchaseStatus(
    session.userId,
    publicOrderNumber,
  );

  if (!purchase) {
    notFound();
  }

  if (purchase.status === "paid") {
    redirect(`/platnosc/sukces?test=1&order=${publicOrderNumber}`);
  }

  if (purchase.status !== "pending") {
    redirect(`/platnosc/niepowodzenie?test=1&order=${publicOrderNumber}`);
  }

  return (
    <section className="payment-result-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="payment-result payment-result--test">
          <p className="checkout-plan__name">Symulator płatności</p>
          <h1>Wybierz wynik transakcji testowej.</h1>
          <p>
            To zamówienie nie łączy się z bankiem i nie pobiera pieniędzy.
            Sukces nada dostęp do kursu, a odrzucenie pozostawi konto bez
            dostępu.
          </p>

          <dl className="payment-test-summary">
            <div>
              <dt>Kurs</dt>
              <dd>{purchase.courseTitle}</dd>
            </div>
            <div>
              <dt>Kwota testowa</dt>
              <dd>
                {(purchase.amountCents / 100).toLocaleString("pl-PL", {
                  style: "currency",
                  currency: purchase.currency,
                })}
              </dd>
            </div>
            <div>
              <dt>Zamówienie</dt>
              <dd>{purchase.publicOrderNumber}</dd>
            </div>
          </dl>

          <div className="payment-result__actions">
            <form method="post" action="/api/payments/test/resolve">
              <input type="hidden" name="order" value={publicOrderNumber} />
              <input type="hidden" name="outcome" value="success" />
              <button type="submit" className="button-primary">
                Zasymuluj sukces
              </button>
            </form>
            <form method="post" action="/api/payments/test/resolve">
              <input type="hidden" name="order" value={publicOrderNumber} />
              <input type="hidden" name="outcome" value="failure" />
              <button type="submit" className="button-secondary">
                Zasymuluj odrzucenie
              </button>
            </form>
          </div>

          <small>
            Tryb testowy należy wyłączyć przed uruchomieniem prawdziwej
            sprzedaży.
          </small>
          <Link href="/kup" className="text-link">
            Anuluj i wróć do zakupu
          </Link>
        </div>
      </div>
    </section>
  );
}
