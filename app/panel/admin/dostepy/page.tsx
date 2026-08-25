import type { Metadata } from "next";
import { AdminPanelPage } from "@/app/panel/admin/AdminPanelPage";

export const metadata: Metadata = {
  title: "Nadaj dostęp | Administracja",
  robots: { index: false, follow: false },
};

export default function AdminGrantsPage(
  props: PageProps<"/panel/admin/dostepy">,
) {
  return <AdminPanelPage section="dostepy" searchParams={props.searchParams} />;
}
