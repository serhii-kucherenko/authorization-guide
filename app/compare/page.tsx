import type { Metadata } from "next";
import { CompareTool } from "@/components/compare-tool";

export const metadata: Metadata = {
  title: "Compare approaches",
  description: "Side-by-side comparison of authentication and authorization approaches.",
};

type PageProps = {
  searchParams: Promise<{ a?: string; b?: string; category?: string }>;
};

export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category =
    params.category === "authentication" ? "authentication" : "authorization";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="mb-2 text-3xl font-semibold text-ink">Compare approaches</h1>
      <p className="mb-10 max-w-2xl text-ink-muted">
        Pick two options and see pros, cons, and when to use each — side by side.
      </p>
      <CompareTool
        initialA={params.a}
        initialB={params.b}
        initialCategory={category}
      />
    </div>
  );
}
