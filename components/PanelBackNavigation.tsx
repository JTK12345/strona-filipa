import type { ReactNode } from "react";
import Link from "next/link";
import { BackHomeLink } from "@/components/BackHomeLink";

export function PanelBackNavigation({ children }: { children?: ReactNode }) {
  return (
    <nav className="panel-back-navigation" aria-label="Nawigacja powrotna">
      <Link href="/panel" className="back-home-button back-panel-button">
        <span aria-hidden="true">←</span>
        <span>Powrót do panelu</span>
      </Link>
      {children}
      <BackHomeLink />
    </nav>
  );
}
