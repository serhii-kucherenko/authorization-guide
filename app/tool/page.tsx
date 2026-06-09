import type { Metadata } from "next";
import Link from "next/link";
import { DecisionWizard } from "@/components/decision-wizard";

export const metadata: Metadata = {
  title: "Decision wizard",
  description:
    "Answer a few questions and get a recommended authentication and authorization stack for your product.",
};

type ToolPageProps = {
  searchParams: Promise<{ state?: string }>;
};

export default async function ToolPage({ searchParams }: ToolPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent">
          Interactive tool
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-ink">
          Pick your authentication & authorization stack
        </h1>
        <p className="text-ink-muted">
          Answer a few questions about your product. We&apos;ll recommend approaches
          and link you to the guides and tools that fit — including sharing scenarios
          when ReBAC is recommended.
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          Prefer visual maps? See the{" "}
          <Link href="/flows" className="text-accent underline">
            flowcharts
          </Link>
          .
        </p>
      </div>

      <DecisionWizard initialStateParam={params.state} />
    </div>
  );
}
