import type { Metadata } from "next";
import Link from "next/link";
import { siteMeta } from "@/lib/site-meta";

export const metadata: Metadata = {
  title: "Why this exists",
  description: "Why AUTH Guide exists — personal notes from learning auth the hard way.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
        About
      </p>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Why AUTH Guide exists
      </h1>

      <div className="space-y-5 text-lg leading-relaxed text-ink-muted">
        <p>
          I built this because I kept screwing up auth on real projects — picking the wrong
          thing early, mixing up &ldquo;who are you&rdquo; with &ldquo;what can you do,&rdquo;
          finding out mid-build that roles or scopes don&apos;t fit anymore.
        </p>
        <p>
          Every resource covered one piece. JWT in one post. RBAC in another. ReBAC in a talk
          for Google-scale teams. Nothing helped me compare them or pick what fit what I was
          actually building.
        </p>
        <p>
          So I went through each approach myself — sessions, JWT, RBAC, ReBAC, the rest — and
          wrote down what finally made the choices click.
        </p>
        <p>
          AUTH Guide is that pile of notes: plain language, trade-offs, flowcharts, tools to
          sanity-check before you lock in an architecture. I use it on my own stuff. If it
          saves you a wrong turn, good.
        </p>
      </div>

      <p className="mt-10 text-sm text-ink-muted">
        —{" "}
        <a
          href={siteMeta.author.github}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink underline decoration-border underline-offset-2 hover:text-accent"
        >
          {siteMeta.author.name}
        </a>
      </p>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-border pt-8">
        <Link
          href="/docs/00-authentication-vs-authorization"
          className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Start reading
        </Link>
        <Link
          href="/tool"
          className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-ink transition hover:bg-paper"
        >
          Open decision tool
        </Link>
      </div>
    </div>
  );
}
