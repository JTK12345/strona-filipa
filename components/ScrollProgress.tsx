"use client";

import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;

      setProgress(nextProgress);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <svg className="scroll-progress" aria-hidden="true" viewBox="0 0 100 4" preserveAspectRatio="none">
      <rect className="scroll-progress__track" x="0" y="0" width="100" height="4" />
      <rect
        className="scroll-progress__bar"
        x="0"
        y="0"
        width={100 * progress}
        height="4"
        rx="0"
      />
    </svg>
  );
}
