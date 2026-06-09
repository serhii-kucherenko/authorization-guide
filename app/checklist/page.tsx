import type { Metadata } from "next";
import { ChecklistTracker } from "@/components/checklist-tracker";

export const metadata: Metadata = {
  title: "Production checklist",
  description: "Interactive pre-launch checklist for authentication and authorization.",
};

export default function ChecklistPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="mb-2 text-3xl font-semibold text-ink">Production checklist</h1>
      <p className="mb-10 text-ink-muted">
        Track progress before you ship. Skip whole sections that don&apos;t apply
        (RBAC, ReBAC, etc.), then check off what you&apos;ve done. Progress saves
        in your browser — no account needed.
      </p>
      <ChecklistTracker />
    </div>
  );
}
