import Link from "next/link";
import {
  authenticationDocs,
  authorizationDocs,
  foundationDocs,
  slugToHref,
} from "@/lib/navigation";

type DocsNavContentProps = {
  activeSlug?: string;
  onNavigate?: () => void;
};

function NavGroup({
  title,
  items,
  activeSlug,
  onNavigate,
}: {
  title: string;
  items: { title: string; slug: string }[];
  activeSlug?: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {title}
      </h2>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = item.slug === activeSlug;
          return (
            <li key={item.slug}>
              <Link
                href={slugToHref(item.slug)}
                onClick={onNavigate}
                className={`block rounded-md px-2 py-1.5 text-sm transition ${
                  active
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-ink-muted hover:bg-paper-dark hover:text-ink"
                }`}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DocsNavContent({ activeSlug, onNavigate }: DocsNavContentProps) {
  return (
    <nav className="space-y-6">
      <NavGroup
        title="Foundation"
        items={foundationDocs}
        activeSlug={activeSlug}
        onNavigate={onNavigate}
      />
      <NavGroup
        title="Authentication"
        items={authenticationDocs}
        activeSlug={activeSlug}
        onNavigate={onNavigate}
      />
      <NavGroup
        title="Authorization"
        items={authorizationDocs}
        activeSlug={activeSlug}
        onNavigate={onNavigate}
      />
    </nav>
  );
}
