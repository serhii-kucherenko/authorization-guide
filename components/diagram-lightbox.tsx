"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type DiagramLightboxProps = {
  children: ReactNode;
  label?: string;
  className?: string;
  disabled?: boolean;
};

const MIN_ZOOM = 50;
const MAX_ZOOM = 250;
const DEFAULT_ZOOM = 100;
const ZOOM_STEP = 10;

type PreparedDiagram = {
  html: string;
  isSvg: boolean;
  baseWidth: number;
  baseHeight: number;
};

function prepareZoomHtml(source: HTMLElement): PreparedDiagram {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = source.innerHTML;

  const svg = wrapper.querySelector("svg");
  if (svg) {
    const previewSvg = source.querySelector("svg");
    const previewRect = previewSvg?.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;

    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.removeAttribute("style");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const baseWidth = Math.max(previewRect?.width ?? 0, viewBox.width || 0, 480);
    const baseHeight =
      previewRect?.height ??
      (viewBox.width > 0 ? (viewBox.height / viewBox.width) * baseWidth : 320);

    svg.style.width = `${baseWidth}px`;
    svg.style.height = "auto";
    svg.style.maxWidth = "none";
    svg.style.display = "block";
    svg.style.marginInline = "auto";

    return { html: wrapper.innerHTML, isSvg: true, baseWidth, baseHeight };
  }

  wrapper.classList.add("diagram-zoom-html-content");
  const rect = wrapper.getBoundingClientRect();

  return {
    html: wrapper.outerHTML,
    isSvg: false,
    baseWidth: rect.width || 360,
    baseHeight: rect.height || 480,
  };
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

type ZoomRailProps = {
  zoom: number;
  onZoomChange: (value: number) => void;
};

function ZoomRail({ zoom, onZoomChange }: ZoomRailProps) {
  return (
    <div className="diagram-zoom-rail flex w-12 shrink-0 flex-col items-center border-l border-border bg-paper-dark/60 px-2 py-4 sm:w-14">
      <button
        type="button"
        onClick={() => onZoomChange(clampZoom(zoom + ZOOM_STEP))}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-lg font-medium text-ink transition hover:border-accent/40 hover:text-accent"
        aria-label="Zoom in"
      >
        +
      </button>

      <div className="my-3 flex flex-1 flex-col items-center justify-center gap-2">
        <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-ink-muted">
          Zoom
        </span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={5}
          value={zoom}
          onChange={(event) => onZoomChange(Number(event.target.value))}
          className="diagram-zoom-range"
          aria-label="Zoom level"
          aria-valuemin={MIN_ZOOM}
          aria-valuemax={MAX_ZOOM}
          aria-valuenow={zoom}
        />
        <span className="text-xs font-medium tabular-nums text-ink">{zoom}%</span>
      </div>

      <button
        type="button"
        onClick={() => onZoomChange(clampZoom(zoom - ZOOM_STEP))}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-lg font-medium text-ink transition hover:border-accent/40 hover:text-accent"
        aria-label="Zoom out"
      >
        −
      </button>

      <button
        type="button"
        onClick={() => onZoomChange(DEFAULT_ZOOM)}
        className="mt-3 text-[0.65rem] font-medium text-accent hover:underline"
      >
        Reset
      </button>
    </div>
  );
}

type DiagramZoomStageProps = {
  html: string;
  isSvg: boolean;
  zoom: number;
  baseWidth: number;
  baseHeight: number;
};

function DiagramZoomStage({
  html,
  isSvg,
  zoom,
  baseWidth,
  baseHeight,
}: DiagramZoomStageProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState({ width: baseWidth, height: baseHeight });

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) {
      return;
    }

    if (isSvg) {
      const svg = el.querySelector("svg");
      if (svg) {
        const viewBox = svg.viewBox.baseVal;
        const width = svg.getBoundingClientRect().width || viewBox.width || baseWidth;
        const height = svg.getBoundingClientRect().height || baseHeight;
        setMeasured({ width, height });
        return;
      }
    }

    setMeasured({ width: el.scrollWidth || baseWidth, height: el.scrollHeight || baseHeight });
  }, [html, isSvg, baseWidth, baseHeight]);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) {
      return;
    }

    const scale = zoom / 100;

    if (isSvg) {
      const svg = el.querySelector("svg");
      if (svg) {
        svg.style.width = `${measured.width * scale}px`;
        svg.style.height = "auto";
        svg.style.maxWidth = "none";
      }
      return;
    }

    el.style.transform = `scale(${scale})`;
    el.style.transformOrigin = "top center";
    el.style.width = `${measured.width}px`;
  }, [zoom, measured, isSvg]);

  const scale = zoom / 100;
  const spacerWidth = measured.width * scale;
  const spacerHeight = measured.height * scale;

  if (isSvg) {
    return (
      <div className="mx-auto w-fit" style={{ minWidth: spacerWidth, minHeight: spacerHeight }}>
        <div ref={innerRef} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ width: spacerWidth, height: spacerHeight }}>
      <div ref={innerRef} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export function DiagramLightbox({
  children,
  label = "Diagram",
  className = "",
  disabled = false,
}: DiagramLightboxProps) {
  const [open, setOpen] = useState(false);
  const [prepared, setPrepared] = useState<PreparedDiagram | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  function openLightbox() {
    if (disabled || !contentRef.current) {
      return;
    }

    setPrepared(prepareZoomHtml(contentRef.current));
    setZoom(DEFAULT_ZOOM);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key === "+" || event.key === "=") {
        setZoom((current) => clampZoom(current + ZOOM_STEP));
      }

      if (event.key === "-") {
        setZoom((current) => clampZoom(current - ZOOM_STEP));
      }

      if (event.key === "0") {
        setZoom(DEFAULT_ZOOM);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    event.preventDefault();
    setZoom((current) =>
      clampZoom(current + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)),
    );
  }

  return (
    <>
      <div
        className={`diagram-zoom group relative ${disabled ? "" : "cursor-zoom-in"} ${className}`}
      >
        <div ref={contentRef}>{children}</div>

        {!disabled && (
          <button
            type="button"
            onClick={openLightbox}
            className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label={`Zoom ${label}`}
          />
        )}

        {!disabled && (
          <span className="pointer-events-none absolute right-3 bottom-3 z-20 rounded-full border border-border bg-card/95 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted opacity-80 shadow-sm transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            Click to zoom
          </span>
        )}
      </div>

      {open && prepared && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            aria-label="Close zoomed diagram"
            className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[92vh] w-full max-w-[min(96vw,90rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p id={titleId} className="text-sm font-medium text-ink">
                  {label}
                </p>
                <p className="text-xs text-ink-muted">
                  Drag the slider or use + / − · Ctrl+scroll to zoom
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-paper-dark hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="flex min-h-0 flex-1">
              <div
                onWheel={handleWheel}
                className={`diagram-zoom-scroll min-h-[50vh] flex-1 overflow-auto p-4 sm:p-8 ${
                  prepared.isSvg ? "diagram-zoom-expanded--svg" : "diagram-zoom-expanded--html"
                }`}
              >
                <DiagramZoomStage
                  html={prepared.html}
                  isSvg={prepared.isSvg}
                  zoom={zoom}
                  baseWidth={prepared.baseWidth}
                  baseHeight={prepared.baseHeight}
                />
              </div>

              <ZoomRail zoom={zoom} onZoomChange={setZoom} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
