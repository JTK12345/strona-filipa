"use client";
import { usePathname } from "next/navigation";
import { Fragment, type ReactNode } from "react";
// All user-facing routes share the new design; administration stays isolated.
export function HomeChrome({
  home,
  fallback,
}: {
  home: ReactNode;
  fallback: ReactNode;
}) {
  const pathname = usePathname();
  return pathname === "/panel/admin" || pathname.startsWith("/panel/admin/")
    ? fallback
    : <Fragment key={pathname}>{home}</Fragment>;
}
