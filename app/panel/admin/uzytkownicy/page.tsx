import type { Metadata } from "next";
import { AdminPanelPage } from "@/app/panel/admin/AdminPanelPage";

export const metadata: Metadata = {
  title: "Użytkownicy | Administracja",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage(
  props: PageProps<"/panel/admin/uzytkownicy">,
) {
  return (
    <AdminPanelPage section="uzytkownicy" searchParams={props.searchParams} />
  );
}
