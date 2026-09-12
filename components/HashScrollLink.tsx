"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type HashScrollLinkProps = ComponentProps<typeof Link> & {
  href: ComponentProps<typeof Link>["href"];
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

        if (
          event.defaultPrevented || event.button !== 0 || event.metaKey ||
          event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank"
        ) {
          return;
        }

        if (typeof href !== "string") {
          return;
        }

        const hrefValue = href;
        const [targetPath, hash] = hrefValue.split("#");
        const currentPath = window.location.pathname;
        const normalizedTargetPath = targetPath || currentPath;

        if (hash && normalizedTargetPath !== currentPath) {
          event.preventDefault();
          // A fresh document keeps the destination fragment intact when returning
          // to a route previously visited with a different fragment.
          window.location.assign(hrefValue);
          return;
        }

        if (!hash && normalizedTargetPath === currentPath) {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          window.history.pushState(null, "", currentPath);
          return;
        }

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
