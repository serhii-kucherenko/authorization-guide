"use client";

import { useEffect } from "react";
import { DiagramLightbox } from "@/components/diagram-lightbox";
import type { Flowchart } from "@/lib/flowcharts";

export function FlowchartDiagram({ chart }: { chart: Flowchart }) {
  const outcomes = chart.nodes.filter((n) => n.type === "outcome" || n.type === "decision");
  const start = chart.nodes.find((n) => n.type === "start");

  return (
    <DiagramLightbox
      label={chart.title}
      className="rounded-xl border border-border bg-paper p-5 transition hover:border-accent/30 hover:shadow-sm"
    >
      {start && (
        <div className="mx-auto mb-4 max-w-xs rounded-lg border-2 border-accent bg-accent-soft px-4 py-3 text-center text-sm font-semibold text-ink">
          {start.label}
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        {chart.edges.map((edge) => {
          const target = chart.nodes.find((n) => n.id === edge.to);
          if (!target || target.type === "start") return null;
          const isOutcome = target.type === "outcome";

          return (
            <div key={`${edge.from}-${edge.to}`} className="flex w-full max-w-md flex-col items-center">
              {edge.label && (
                <span className="mb-1 text-xs font-medium text-ink-muted">{edge.label}</span>
              )}
              <span className="text-ink-muted">↓</span>
              <div
                className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-center text-sm ${
                  isOutcome
                    ? "border-accent/30 bg-card font-medium text-ink"
                    : "border-border bg-paper-dark text-ink-muted"
                }`}
              >
                {target.label}
              </div>
            </div>
          );
        })}
      </div>

      {outcomes.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Outcomes
          </p>
          <div className="flex flex-wrap gap-2">
            {outcomes.map((node) => (
              <span
                key={node.id}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs text-ink-muted"
              >
                {node.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </DiagramLightbox>
  );
}

export function FlowchartGrid({
  charts,
  scrollToId,
}: {
  charts: Flowchart[];
  scrollToId?: string;
}) {
  useEffect(() => {
    if (!scrollToId) {
      return;
    }

    const element = document.getElementById(`flow-${scrollToId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollToId]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {charts.map((chart) => (
        <div key={chart.id} id={`flow-${chart.id}`} className="scroll-mt-24">
          <h3 className="mb-1 text-lg font-semibold text-ink">{chart.title}</h3>
          <p className="mb-4 text-sm text-ink-muted">{chart.description}</p>
          <FlowchartDiagram chart={chart} />
        </div>
      ))}
    </div>
  );
}
