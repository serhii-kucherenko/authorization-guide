"use client";

import { useEffect, useRef } from "react";
import { buildAuthMindmapMarkdown } from "@/lib/auth-mindmap";
import {
  fitMarkmapViewport,
  installMarkmapExpandAutoFit,
  installMarkmapViewportConstraints,
  waitForMarkmapLayout,
} from "@/lib/markmap-viewport";
import { Transformer } from "markmap-lib";
import { Markmap, deriveOptions, loadCSS, loadJS } from "markmap-view";
import { Toolbar } from "markmap-toolbar";
import "markmap-toolbar/dist/style.css";

const transformer = new Transformer();

export function AuthMarkmap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const markmapRef = useRef<Markmap | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const toolbarHost = toolbarRef.current;
    if (!svg || !toolbarHost) {
      return;
    }

    const { root, features, frontmatter } = transformer.transform(
      buildAuthMindmapMarkdown(),
    );
    const assets = transformer.getUsedAssets(features);

    if (assets.styles) {
      loadCSS(assets.styles);
    }

    if (assets.scripts) {
      void loadJS(assets.scripts, {
        getMarkmap: () => ({ Markmap }),
      });
    }

    const mm = Markmap.create(
      svg,
      {
        ...deriveOptions(frontmatter?.markmap),
        zoom: true,
        pan: true,
        autoFit: false,
        paddingX: 16,
        spacingVertical: 8,
        spacingHorizontal: 80,
      },
      null,
    );

    installMarkmapViewportConstraints(mm);
    const removeExpandAutoFit = installMarkmapExpandAutoFit(mm);
    markmapRef.current = mm;

    const toolbar = Toolbar.create(mm);
    toolbar.showBrand = false;
    toolbarHost.replaceChildren(toolbar.render());

    let cancelled = false;

    void (async () => {
      await mm.setData(root);
      if (cancelled) {
        return;
      }

      await waitForMarkmapLayout();
      if (cancelled) {
        return;
      }

      await fitMarkmapViewport(mm);

      // ResizeObserver inside markmap can relayout once foreignObject sizes settle.
      await waitForMarkmapLayout();
      if (cancelled) {
        return;
      }

      await fitMarkmapViewport(mm);
    })();

    function onResize() {
      void markmapRef.current?.fit();
    }

    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      removeExpandAutoFit();
      window.removeEventListener("resize", onResize);
      mm.destroy();
      markmapRef.current = null;
      toolbarHost.replaceChildren();
    };
  }, []);

  return (
    <div className="auth-markmap overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div ref={toolbarRef} className="border-b border-border bg-paper px-2 py-1" />
      <svg
        ref={svgRef}
        role="img"
        aria-label="Interactive AUTH mindmap"
        className="block h-[min(75vh,780px)] w-full touch-none"
      />
      <p className="border-t border-border px-4 py-2.5 text-xs text-ink-muted">
        Scroll to zoom · drag to pan · click a branch to fold or unfold
      </p>
    </div>
  );
}
