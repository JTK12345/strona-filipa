import type { Metadata } from "next";
import { AdminPanelPage } from "@/app/panel/admin/AdminPanelPage";

export const metadata: Metadata = {
  title: "Kody dostępu | Administracja",
  robots: { index: false, follow: false },
};

export default function AdminAccessCodesPage(
  props: PageProps<"/panel/admin/kody">,
) {
  return <AdminPanelPage section="kody" searchParams={props.searchParams} />;
}
