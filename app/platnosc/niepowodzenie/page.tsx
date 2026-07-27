import type { Metadata } from "next";
import Link from "next/link";
import { BackHomeLink } from "@/components/BackHomeLink";

export const metadata: Metadata = {
  title: "Płatność nieukończona | Świadomy Profil Ciała",
  robots: { index: false, follow: false },
};

export default async function PaymentFailurePage(
  props: PageProps<"/platnosc/niepowodzenie">,
) {
  const searchParams = await props.searchParams;
  const isTestPayment = searchParams.test === "1";

  return (
    <section className="payment-result-page">
      <div className="container-main">
        <BackHomeLink />
        <div className="payment-result payment-result--error">
          <p className="checkout-plan__name">
            {isTestPayment ? "Test odrzucony" : "Płatność nieukończona"}
          </p>
          <h1>Dostęp nie został jeszcze aktywowany.</h1>
          <p>
            {isTestPayment
              ? "Symulator oznaczył zamówienie jako odrzucone. Możesz rozpocząć kolejny test albo wrócić do panelu."
              : "Możesz rozpocząć płatność ponownie. Kurs zostanie przypisany dopiero po potwierdzeniu transakcji przez Przelewy24."}
          </p>
          <div className="payment-result__actions">
            <Link href="/kup" className="button-primary">
              Wróć do zakupu
            </Link>
            <Link href="/panel" className="button-secondary">
              Przejdź do panelu
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
