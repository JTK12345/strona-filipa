"use client";

import { useState } from "react";

export function CopyGeneratedCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className="button-secondary" onClick={copyCode}>
      {copied ? "Skopiowano" : "Kopiuj kod"}
    </button>
  );
}

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
  name,
  value,
}: {
  children: React.ReactNode;
  className: string;
  confirmMessage: string;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
