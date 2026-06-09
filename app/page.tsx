import Link from "next/link";
import { slugToHref } from "@/lib/navigation";

const startHere = [
  {
    href: slugToHref("00-authentication-vs-authorization"),
    title: "Authentication vs authorization",
    description: "The split every guide assumes you already know — start here.",
  },
  {
    href: "/docs",
    title: "All guides",
    description: "Sessions, JWT, RBAC, ReBAC, scopes, policy engines — each with trade-offs and examples.",
  },
  {
    href: "/tool",
    title: "Decision wizard",
    description: "Answer a few questions, get a suggested stack with links to the right guides.",
  },
];

const tools = [
  { href: "/tool", label: "Wizard", note: "Pick a stack" },
  { href: "/compare", label: "Compare", note: "Side-by-side + code" },
  { href: "/flows", label: "Flowcharts", note: "Visual decision trees" },
  { href: "/checklist", label: "Checklist", note: "Pre-launch review" },
  { href: "/mindmap", label: "Mindmap", note: "Full topic map" },
  { href: "/matrix", label: "Matrix", note: "Roles × permissions" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      {/* Mission — one screen, no scroll required to get it */}
      <header className="mb-14">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          Developer guide
        </p>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-ink sm:text-[2.75rem] sm:leading-tight">
          Authentication & authorization, explained for builders
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-ink-muted">
          Written guides on how each approach works — sessions, JWT, RBAC, ReBAC, and
          the rest. Plus small tools to compare options, map the space, and review
          your stack before you ship.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex overflow-hidden rounded-lg bg-accent shadow-sm"
            role="group"
            aria-label="Start reading"
          >
            <Link
              href="/docs"
              className="px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/10"
            >
              Guides
            </Link>
            <span
              className="flex items-center text-sm font-light text-white/40"
              aria-hidden
            >
              |
            </span>
            <Link
              href="/mindmap"
              className="px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/10"
            >
              Mindmap
            </Link>
          </div>
          <Link
            href="/tools"
            className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-ink transition hover:bg-paper-dark"
          >
            Browse tools
          </Link>
        </div>
      </header>

      {/* Start here — three entry points, that's it */}
      <section className="mb-14">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Start here
        </h2>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {startHere.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group block px-5 py-4 transition first:rounded-t-xl last:rounded-b-xl hover:bg-paper-dark/60"
              >
                <span className="block font-semibold text-ink group-hover:text-accent">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted">
                  {item.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Tools — compact list, not a product grid */}
      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Tools
          </h2>
          <Link
            href="/about"
            className="text-sm text-ink-muted underline decoration-border hover:text-accent"
          >
            Why this exists
          </Link>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-ink-muted">
          Use these while you read — or when you already know the basics and need to
          decide or double-check.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {tools.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="flex items-baseline justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition hover:border-accent/40"
              >
                <span className="font-medium text-ink">{tool.label}</span>
                <span className="text-ink-muted">{tool.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
