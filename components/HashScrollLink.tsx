"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type HashScrollLinkProps = ComponentProps<typeof Link> & {
  href: `/${string}#${string}` | `#${string}`;
};

export function HashScrollLink({
  href,
  onClick,
  ...props
}: HashScrollLinkProps) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        const hrefValue = String(href);
        const [targetPath, hash] = hrefValue.split("#");
        const currentPath = window.location.pathname;
        const normalizedTargetPath = targetPath || currentPath;

        if (hash && normalizedTargetPath === currentPath) {
          event.preventDefault();
          const target = document.getElementById(hash);

          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            window.history.pushState(null, "", `${currentPath}#${hash}`);
          }
        }
      }}
      {...props}
    />
  );
}
