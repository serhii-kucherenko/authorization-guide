import type { Metadata } from "next";
import { RebacPlayground } from "@/components/rebac-playground";

export const metadata: Metadata = {
  title: "ReBAC scenarios",
  description: "Interactive sharing scenarios for relationship-based access control.",
};

type PageProps = {
  searchParams: Promise<{ scenario?: string }>;
};

export default async function ScenariosPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="mb-2 text-3xl font-semibold text-ink">ReBAC sharing scenarios</h1>
      <p className="mb-10 max-w-2xl text-ink-muted">
        Explore how relationship-based access control handles document sharing, team
        folders, and guests — with live allow/deny checks.
      </p>
      <RebacPlayground initialScenarioId={params.scenario} />
    </div>
  );
}
