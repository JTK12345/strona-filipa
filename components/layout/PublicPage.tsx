"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./public-pages.module.css";

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
      className={themed ? `${styles.content} ${fontClass}` : undefined}
      data-public-design={themed ? "sage" : undefined}
    >
      {children}
    </main>
  );
}
