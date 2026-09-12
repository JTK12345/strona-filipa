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
    const header = document.querySelector("header");
    const previousScrollPadding = document.documentElement.style.scrollPaddingTop;
    const updateScrollPadding = () => {
      if (header) {
        document.documentElement.style.scrollPaddingTop = `${header.getBoundingClientRect().height + 16}px`;
      }
    };
    updateScrollPadding();
    const resizeObserver = new ResizeObserver(updateScrollPadding);
    if (header) resizeObserver.observe(header);

    requestAnimationFrame(scrollToCurrentHash);
    const timeout = window.setTimeout(scrollToCurrentHash, 150);

    window.addEventListener("hashchange", scrollToCurrentHash);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.scrollPaddingTop = previousScrollPadding;
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", scrollToCurrentHash);
    };
  }, []);

  return null;
}
