import type { Metadata } from "next";
import { AdminPanelPage } from "@/app/panel/admin/AdminPanelPage";

export const metadata: Metadata = {
  title: "Audyt | Administracja",
  robots: { index: false, follow: false },
};

export default function AdminAuditPage(
  props: PageProps<"/panel/admin/audyt">,
) {
  return <AdminPanelPage section="audyt" searchParams={props.searchParams} />;
}
