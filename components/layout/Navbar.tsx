import Link from "next/link";
import { siteConfig } from "@/content/site";

const links = [
  { href: "#uslugi", label: "Usługi" },
  { href: "#o-mnie", label: "O mnie" },
  { href: "#faq", label: "FAQ" },
  { href: "#kontakt", label: "Kontakt" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(239,231,211,0.96)] backdrop-blur">
      <div className="container-main flex min-h-[108px] items-center justify-between gap-8">
        <Link href="/" className="shrink-0 no-underline">
          <div className="flex flex-col">
            <span className="text-[2.1rem] font-extrabold leading-none tracking-[-0.05em] text-[var(--foreground)]">
              Świadomy Profil Ciała
            </span>
            <span className="mt-2 text-[0.78rem] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              Holistyczna opieka nad zdrowiem
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[1.05rem] font-semibold text-[var(--foreground)] transition-opacity hover:opacity-70"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href={siteConfig.bookingUrl}
          className="button-primary shrink-0 px-7 py-4 text-[0.95rem] font-extrabold"
        >
          Umów konsultację
        </a>
      </div>
    </header>
  );
}