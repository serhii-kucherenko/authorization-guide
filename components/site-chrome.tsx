import Link from "next/link";
import { siteMeta } from "@/lib/site-meta";

const navItems = [
  { href: "/docs/00-authentication-vs-authorization", label: "Start here" },
  { href: "/mindmap", label: "Mindmap" },
  { href: "/tools", label: "Tools" },
  { href: "/tool", label: "Wizard" },
  { href: "/checklist", label: "Checklist" },
  { href: "/docs", label: "Docs" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          {siteMeta.title}
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-2 text-sm font-medium text-ink-muted transition hover:bg-paper-dark hover:text-ink sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-paper-dark">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-ink-muted">
              Made by{" "}
              <a
                href={siteMeta.author.github}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink underline decoration-border underline-offset-2 transition hover:text-accent hover:decoration-accent"
              >
                {siteMeta.author.name}
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/about" className="font-medium text-accent hover:underline">
              Why this exists
            </Link>
            <Link href="/tools" className="font-medium text-accent hover:underline">
              All tools
            </Link>
            <Link href="/checklist" className="font-medium text-accent hover:underline">
              Production checklist
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
