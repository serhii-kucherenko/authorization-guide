import type { Metadata } from "next";
import { ToolsNav } from "@/components/tools-nav";

export const metadata: Metadata = {
  title: "Tools",
  description: "Interactive tools for choosing and validating authentication and authorization.",
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="mb-2 text-3xl font-semibold text-ink">Tools</h1>
      <p className="mb-10 max-w-2xl text-ink-muted">
        Interactive helpers to pick approaches, compare trade-offs, track production
        readiness, build role matrices, and explore relationship-based sharing.
      </p>
      <ToolsNav />
    </div>
  );
}
