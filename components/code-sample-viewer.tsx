"use client";

import { useEffect, useId, useState } from "react";

export const INLINE_MAX_HEIGHT = "max-h-[28rem]";
export const EXTENDED_MAX_HEIGHT = "max-h-[min(70vh,56rem)]";

type CodeSampleViewerProps = {
  label: string;
  language: string;
  code: string;
  html: string | null;
  blockClassName?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  showToolbar?: boolean;
};

export function CodeSampleContent({
  html,
  code,
  language,
  blockClassName = "compare-code",
  maxHeightClass,
  unbounded = false,
}: {
  html: string | null;
  code: string;
  language: string;
  blockClassName?: string;
  maxHeightClass?: string;
  unbounded?: boolean;
}) {
  const shellClass = unbounded
    ? `${blockClassName} shiki-block text-sm`
    : `${blockClassName} shiki-block ${maxHeightClass} overflow-y-auto overflow-x-auto rounded-xl border border-stone-700/80 bg-[#24292e] text-sm`;

  return (
    <div className={shellClass} data-language={language}>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="p-4 text-stone-100">
          <code>{code.trim()}</code>
        </pre>
      )}
    </div>
  );
}

export function CodeSampleViewer({
  label,
  language,
  code,
  html,
  blockClassName = "compare-code",
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  showToolbar = true,
}: CodeSampleViewerProps) {
  const [internalExtended, setInternalExtended] = useState(defaultExpanded);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const titleId = useId();
  const dialogDescriptionId = useId();

  const isExtended = expanded ?? internalExtended;

  function setExtended(next: boolean) {
    if (expanded === undefined) {
      setInternalExtended(next);
    }
    onExpandedChange?.(next);
  }

  const maxHeightClass = isExtended ? EXTENDED_MAX_HEIGHT : INLINE_MAX_HEIGHT;

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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopyMessage("Copied");
    } catch {
      setCopyMessage("Copy failed");
    }

    window.setTimeout(() => setCopyMessage(""), 2000);
  }

  return (
    <>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{label}</p>
          {showToolbar ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setExtended(!isExtended)}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:border-accent/30 hover:text-ink"
                aria-pressed={isExtended}
                aria-label={
                  isExtended ? `Collapse ${label} code sample` : `Expand ${label} code sample`
                }
              >
                {isExtended ? "Collapse" : "Expand"}
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:border-accent/30 hover:text-ink"
                aria-label={`Open ${label} code sample in full screen`}
              >
                Full screen
              </button>
            </div>
          ) : null}
        </div>

        <CodeSampleContent
          html={html}
          code={code}
          language={language}
          blockClassName={blockClassName}
          maxHeightClass={maxHeightClass}
        />
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            aria-label="Close full screen code sample"
            className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"
            onClick={() => setIsFullscreen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={dialogDescriptionId}
            className="relative z-10 flex max-h-[96vh] w-full max-w-[min(96vw,72rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p id={titleId} className="truncate text-sm font-medium text-ink">
                  {label}
                </p>
                <p id={dialogDescriptionId} className="text-xs text-ink-muted">
                  {language} · Scroll to read · Escape to close
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {copyMessage ? (
                  <span className="text-xs font-medium text-accent" aria-live="polite">
                    {copyMessage}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-paper-dark hover:text-ink"
                >
                  Copy code
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-paper-dark hover:text-ink"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="code-sample-fullscreen-scroll min-h-0 flex-1 overflow-auto rounded-b-2xl border-t border-stone-700/50 bg-[#24292e] p-4 sm:p-6">
              <CodeSampleContent
                html={html}
                code={code}
                language={language}
                blockClassName={blockClassName}
                unbounded
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
