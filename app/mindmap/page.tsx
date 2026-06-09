import type { Metadata } from "next";
import Link from "next/link";
import { AuthMarkmap } from "@/components/auth-markmap";

export const metadata: Metadata = {
  title: "Mindmap",
  description:
    "Visual breakdown of authentication and authorization — how the pieces fit together.",
};

export default function MindmapPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-10 max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent">
          Big picture
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-ink">AUTH mindmap</h1>
        <p className="text-ink-muted">
          Interactive map of the whole breakdown — authentication, authorization, and the
          approaches under each. Zoom, pan, fold branches. Node text is the content; guide
          links open when you want depth.
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          New here?{" "}
          <Link
            href="/docs/00-authentication-vs-authorization"
            className="text-accent underline hover:decoration-accent"
          >
            Auth vs authorization
          </Link>{" "}
          first.
        </p>
      </div>

      <AuthMarkmap />
    </div>
  );
}
