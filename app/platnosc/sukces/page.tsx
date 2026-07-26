import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentAccessSession } from "@/app/lib/access";
import { BackHomeLink } from "@/components/BackHomeLink";
import { PaymentStatus } from "@/components/course/PaymentStatus";

export const metadata: Metadata = {
  title: "Status płatności | Świadomy Profil Ciała",
  robots: { index: false, follow: false },
};

export default async function PaymentSuccessPage(
  props: PageProps<"/platnosc/sukces">,
) {
  const searchParams = await props.searchParams;
  const session = await getCurrentAccessSession();
  const orderNumber =
    typeof searchParams.order === "string" &&
    /^PC-[A-F0-9]{16}$/.test(searchParams.order)
      ? searchParams.order
      : null;

  return (
    <section className="payment-result-page">
      <div className="container-main">
        <BackHomeLink />
        {!session ? (
          <div className="payment-result">
            <p className="checkout-plan__name">Status zamówienia</p>
            <h1>Zaloguj się, aby sprawdzić płatność.</h1>
            <p>
              Status zamówienia jest widoczny tylko na koncie, z którego
              rozpoczęto zakup.
            </p>
            <Link href="/logowanie?next=/panel" className="button-primary">
              Zaloguj się
            </Link>
          </div>
        ) : orderNumber ? (
          <PaymentStatus orderNumber={orderNumber} />
        ) : (
          <div className="payment-result payment-result--error">
            <p className="checkout-plan__name">Brak numeru zamówienia</p>
            <h1>Nie możemy wskazać płatności do sprawdzenia.</h1>
            <p>Otwórz panel, aby zobaczyć swoje kursy i ostatnie zamówienia.</p>
            <Link href="/panel" className="button-primary">
              Przejdź do panelu
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
