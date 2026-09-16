"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./public-pages.module.css";
import adminStyles from "./admin-pages.module.css";

export function PublicPage({
  children,
  fontClass,
}: {
  children: ReactNode;
  fontClass: string;
}) {
  const pathname = usePathname();
  const isAdmin =
    pathname === "/panel/admin" || pathname.startsWith("/panel/admin/");
  const themed = pathname !== "/" && !isAdmin;
  return (
    <main
      className={
        isAdmin
          ? `${adminStyles.content} ${fontClass}`
          : themed
            ? `${styles.content} ${fontClass}`
            : undefined
      }
      data-admin-design={isAdmin ? "sage" : undefined}
      data-public-design={themed ? "sage" : undefined}
    >
      {children}
    </main>
  );
}
