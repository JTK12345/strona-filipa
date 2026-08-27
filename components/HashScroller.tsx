"use client";

import { useEffect } from "react";

function scrollToCurrentHash() {
  const hash = window.location.hash.slice(1);

  if (!hash) {
    return;
  }

  const target = document.getElementById(decodeURIComponent(hash));

  if (target) {
    target.scrollIntoView({ block: "start" });
  }
}

export function HashScroller() {
  useEffect(() => {
    requestAnimationFrame(scrollToCurrentHash);
    const timeout = window.setTimeout(scrollToCurrentHash, 150);

    window.addEventListener("hashchange", scrollToCurrentHash);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", scrollToCurrentHash);
    };
  }, []);

  return null;
}
