import type { Metadata } from "next";
import Link from "next/link";
import { FlowchartGrid } from "@/components/flowchart-diagram";
import { flowcharts } from "@/lib/flowcharts";

export const metadata: Metadata = {
  title: "Flowcharts",
  description: "Visual decision trees for authentication and authorization.",
};

type FlowsPageProps = {
  searchParams: Promise<{ chart?: string }>;
};

export default async function FlowsPage({ searchParams }: FlowsPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="mb-2 text-3xl font-semibold text-ink">Flowcharts</h1>
      <p className="mb-4 max-w-2xl text-ink-muted">
        Visual maps for common decisions. Pair these with the{" "}
        <Link href="/tool" className="text-accent underline">
          decision wizard
        </Link>{" "}
        or{" "}
        <Link href="/compare" className="text-accent underline">
          comparison tool
        </Link>
        .
      </p>
      <FlowchartGrid charts={flowcharts} scrollToId={params.chart} />
    </div>
  );
}
