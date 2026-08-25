import type { Metadata } from "next";
import { AdminPanelPage } from "@/app/panel/admin/AdminPanelPage";

export const metadata: Metadata = {
  title: "Kursy | Administracja",
  robots: { index: false, follow: false },
};

export default function AdminCoursesPage(
  props: PageProps<"/panel/admin/kursy">,
) {
  return <AdminPanelPage section="kursy" searchParams={props.searchParams} />;
}
