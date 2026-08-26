import type { Metadata } from "next";
import { AdminPanelPage } from "@/app/panel/admin/AdminPanelPage";

export const metadata: Metadata = {
  title: "Zgłoszenia | Administracja",
  robots: { index: false, follow: false },
};

export default function AdminSubmissionsPage(
  props: PageProps<"/panel/admin/zgloszenia">,
) {
  return <AdminPanelPage section="zgloszenia" searchParams={props.searchParams} />;
}
