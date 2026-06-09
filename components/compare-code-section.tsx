"use client";

import { useEffect, useId, useState } from "react";
import { CodeSampleContent } from "@/components/code-sample-viewer";
import { CompareCodeSample } from "@/components/compare-code-sample";

type CompareSide = {
  label: string;
  language: string;
  code: string;
};

type CompareCodeSectionProps = {
  optionA: CompareSide;
  optionB: CompareSide;
};

type HighlightedSide = CompareSide & {
  html: string | null;
};

function CompareFullscreenPanel({
  side,
  copyMessage,
  onCopy,
}: {
  side: HighlightedSide;
  copyMessage: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{side.label}</p>
          <p className="text-xs text-ink-muted">{side.language}</p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-paper-dark hover:text-ink"
        >
          Copy code
        </button>
      </div>
      {copyMessage ? (
        <p className="px-3 py-1 text-xs font-medium text-accent sm:px-4" aria-live="polite">
          {copyMessage}
        </p>
      ) : null}
      <div className="code-sample-fullscreen-scroll min-h-0 flex-1 overflow-auto bg-[#24292e] p-3 sm:p-4">
        <CodeSampleContent
          html={side.html}
          code={side.code}
          language={side.language}
          blockClassName="compare-code"
          unbounded
        />
      </div>
    </div>
  );
}

export function CompareCodeSection({ optionA, optionB }: CompareCodeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightA, setHighlightA] = useState<string | null>(null);
  const [highlightB, setHighlightB] = useState<string | null>(null);
  const [copyMessageA, setCopyMessageA] = useState("");
  const [copyMessageB, setCopyMessageB] = useState("");
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  async function handleCopy(side: "a" | "b", text: string) {
    const setMessage = side === "a" ? setCopyMessageA : setCopyMessageB;

    try {
      await navigator.clipboard.writeText(text.trim());
      setMessage("Copied");
    } catch {
      setMessage("Copy failed");
    }

    window.setTimeout(() => setMessage(""), 2000);
  }

  function openFullscreen() {
    setCopyMessageA("");
    setCopyMessageB("");
    setIsFullscreen(true);
  }

  return (
    <>
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Code sketch</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Setup, check, and usage for each approach — side by side.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:border-accent/30 hover:text-ink"
              aria-pressed={isExpanded}
              aria-label={isExpanded ? "Collapse both code samples" : "Expand both code samples"}
            >
              {isExpanded ? "Collapse all" : "Expand all"}
            </button>
            <button
              type="button"
              onClick={openFullscreen}
              className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:border-accent/30 hover:text-ink"
              aria-label={`Open ${optionA.label} and ${optionB.label} comparison in full screen`}
            >
              Full screen compare
            </button>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <CompareCodeSample
            label={optionA.label}
            language={optionA.language}
            code={optionA.code}
            expanded={isExpanded}
            showToolbar={false}
            onHtmlReady={setHighlightA}
          />
          <CompareCodeSample
            label={optionB.label}
            language={optionB.language}
            code={optionB.code}
            expanded={isExpanded}
            showToolbar={false}
            onHtmlReady={setHighlightB}
          />
        </div>

        <p className="mt-3 text-xs text-ink-muted">
          Illustrative patterns — not copy-paste production code.
        </p>
      </div>

      {isFullscreen ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            aria-label="Close full screen code comparison"
            className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"
            onClick={() => setIsFullscreen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative z-10 flex max-h-[96vh] w-full max-w-[min(96vw,90rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p id={titleId} className="truncate text-sm font-medium text-ink">
                  {optionA.label} vs {optionB.label}
                </p>
                <p id={descriptionId} className="text-xs text-ink-muted">
                  Side-by-side code sketch · Scroll each column · Escape to close
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-paper-dark hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="grid min-h-0 flex-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <CompareFullscreenPanel
                side={{ ...optionA, html: highlightA }}
                copyMessage={copyMessageA}
                onCopy={() => handleCopy("a", optionA.code)}
              />
              <CompareFullscreenPanel
                side={{ ...optionB, html: highlightB }}
                copyMessage={copyMessageB}
                onCopy={() => handleCopy("b", optionB.code)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
