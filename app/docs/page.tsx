import Link from "next/link";
import {
  authenticationDocs,
  authorizationDocs,
  foundationDocs,
  slugToHref,
} from "@/lib/navigation";

function DocList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: { title: string; slug: string; summary: string }[];
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 text-xl font-semibold text-ink">{title}</h2>
      <p className="mb-4 text-sm text-ink-muted">{description}</p>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={slugToHref(item.slug)}
              className="flex flex-col gap-1 px-4 py-4 transition hover:bg-paper sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium text-ink">{item.title}</span>
              <span className="text-sm text-ink-muted sm:max-w-md sm:text-right">
                {item.summary}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DocsIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="mb-2 text-3xl font-semibold text-ink">All guides</h1>
      <p className="mb-10 text-ink-muted">
        Browse every topic. Start with{" "}
        <Link href="/docs/00-authentication-vs-authorization" className="text-accent underline">
          Authentication vs Authorization
        </Link>{" "}
        if you are new.
      </p>

      <DocList
        title="Foundation"
        description="Core concepts and how to choose"
        items={foundationDocs}
      />
      <DocList
        title="Authentication"
        description="Who are you? — login and identity"
        items={authenticationDocs}
      />
      <DocList
        title="Authorization"
        description="What can you do? — permissions and access"
        items={authorizationDocs}
      />
    </div>
  );
}
