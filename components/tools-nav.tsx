import Link from "next/link";

export const toolLinks = [
  { href: "/mindmap", label: "Mindmap", description: "Whole AUTH breakdown" },
  { href: "/tool", label: "Decision wizard", description: "Pick your stack" },
  { href: "/flows", label: "Flowcharts", description: "Visual decision trees" },
  { href: "/compare", label: "Compare", description: "Side-by-side approaches" },
  { href: "/checklist", label: "Checklist", description: "Pre-launch tracker" },
  { href: "/matrix", label: "Matrix builder", description: "Roles × permissions" },
  { href: "/scenarios", label: "ReBAC scenarios", description: "Sharing playground" },
];

export function ToolsNav({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {toolLinks.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
          >
            {tool.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {toolLinks.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className="rounded-xl border border-border bg-card p-4 transition hover:border-accent/40 hover:shadow-sm"
        >
          <span className="block font-semibold text-ink">{tool.label}</span>
          <span className="text-sm text-ink-muted">{tool.description}</span>
        </Link>
      ))}
    </div>
  );
}
