import type { Metadata } from "next";
import { MatrixBuilder } from "@/components/matrix-builder";

export const metadata: Metadata = {
  title: "Permission matrix builder",
  description: "Build role-permission matrices with 10 templates and export to JSON, Casbin, or Markdown.",
};

export default function MatrixPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="mb-2 text-3xl font-semibold text-ink">Permission matrix builder</h1>
      <p className="mb-10 max-w-2xl text-ink-muted">
        Define roles and permissions, load a template for your product type, and export
        JSON, Casbin CSV, Markdown, or middleware snippets. Your matrix is saved locally.
      </p>
      <MatrixBuilder />
    </div>
  );
}
