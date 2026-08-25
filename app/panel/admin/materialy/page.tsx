import type { Metadata } from "next";
import { AdminPanelPage } from "@/app/panel/admin/AdminPanelPage";

export const metadata: Metadata = {
  title: "Materiały | Administracja",
  robots: { index: false, follow: false },
};

export default function AdminMaterialsPage(
  props: PageProps<"/panel/admin/materialy">,
) {
  return <AdminPanelPage section="materialy" searchParams={props.searchParams} />;
}
