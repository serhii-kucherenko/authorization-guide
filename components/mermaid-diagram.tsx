"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DiagramLightbox } from "@/components/diagram-lightbox";

type MermaidDiagramProps = {
  chart: string;
  label?: string;
};

let mermaidReady = false;

async function ensureMermaid() {
  const mermaid = (await import("mermaid")).default;

  if (!mermaidReady) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        primaryColor: "#ccfbf1",
        primaryTextColor: "#1c1917",
        primaryBorderColor: "#0f766e",
        secondaryColor: "#faf8f5",
        tertiaryColor: "#ffffff",
        lineColor: "#57534e",
        fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif",
      },
      flowchart: {
        curve: "basis",
        padding: 20,
        htmlLabels: true,
      },
    });
    mermaidReady = true;
  }

  return mermaid;
}

export function MermaidDiagram({ chart, label = "Flowchart" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current) return;

      try {
        const mermaid = await ensureMermaid();
        const { svg } = await mermaid.render(`mermaid-${renderId}`, chart.trim());

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not render diagram");
          setReady(false);
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart, renderId]);

  if (error) {
    return (
      <div className="my-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">Diagram could not be rendered</p>
        <pre className="mt-2 overflow-x-auto text-xs">{chart}</pre>
      </div>
    );
  }

  return (
    <DiagramLightbox
      label={label}
      disabled={!ready}
      className="mermaid-diagram my-6 overflow-x-auto rounded-xl border border-border bg-card p-4 transition hover:border-accent/30 hover:shadow-sm"
    >
      <div ref={containerRef} aria-label="Flowchart diagram" />
    </DiagramLightbox>
  );
}
