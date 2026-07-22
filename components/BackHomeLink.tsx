import Link from "next/link";

export function BackHomeLink() {
  return (
    <Link href="/" className="back-home-button">
      <span aria-hidden="true">←</span>
      <span>Strona główna</span>
    </Link>
  );
}
