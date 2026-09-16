import type { Metadata } from "next";
import { ErrorScreen } from "@/components/errors/ErrorScreen";

export const metadata: Metadata = {
  title: "Nie znaleziono strony | Świadomy Profil Ciała",
  description: "Ten adres nie istnieje albo strona została przeniesiona.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      title="Ta ścieżka kończy się tutaj."
      description="Ten adres nie istnieje albo strona została przeniesiona. Wróć na stronę główną — znajdziesz tam ofertę, kursy i materiały do dalszej pracy."
    />
  );
}
